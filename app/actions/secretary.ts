'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function bulkCreateStudents(userListText: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SEKRETARIS') {
    return { success: false, error: 'Unauthorized' };
  }

  // Format expectation: NIM,Name,Email (optional)
  // OR just NIM (Name defaults to "Praktikan NIM", Email defaults to NIM@student...)
  
  const lines = userListText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let createdCount = 0;
  let errors = [];

  for (const line of lines) {
    try {
      const parts = line.split(',').map(p => p.trim());
      const nim = parts[0];
      if (!nim) continue;

      const name = parts[1] || `Praktikan ${nim}`;
      const email = parts[2] || `${nim}@student.telkomuniversity.ac.id`;
      const passwordHash = await bcrypt.hash(nim, 10); // Default pass = NIM

      // Check existing
      const existing = await prisma.user.findUnique({ where: { username: nim } });
      if (existing) {
        errors.push(`NIM ${nim} already exists`);
        continue;
      }

      await prisma.user.create({
        data: {
          username: nim,
          name,
          email,
          role: 'PRAKTIKAN',
          passwordHash,
          nim
        }
      });
      createdCount++;
    } catch (e) {
      console.error(e);
      errors.push(`Failed to create ${line}`);
    }
  }

  revalidatePath('/dashboard/sekretaris/users');
  return { success: true, createdCount, errors };
}

export async function getShiftsAndAssistants() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SEKRETARIS') throw new Error('Unauthorized');

    const shifts = await prisma.shift.findMany({
        include: { course: true, plottings: { include: { assistant: true } } },
        orderBy: { courseId: 'asc' }
    });

    const assistants = await prisma.user.findMany({
        where: { role: 'ASISTEN' },
        orderBy: { name: 'asc' }
    });

    return { shifts, assistants };
}

export async function createPlotting(shiftId: string, assistantId: string, plotNo: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SEKRETARIS') throw new Error('Unauthorized');

    // Check collision? An assistant can handle multiple plots in DIFFERENT shifts, but usually not same shift.
    // But schema allows.
    
    // Upsert plotting
    await prisma.plotting.upsert({
        where: {
            shiftId_plotNo: { shiftId, plotNo }
        },
        update: { assistantId },
        create: {
            shiftId,
            assistantId,
            plotNo
        }
    });

    revalidatePath('/dashboard/sekretaris/plotting');
    return { success: true };
}

export async function autoAssignStudentsToShift(shiftId: string, studentNims: string[]) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SEKRETARIS') throw new Error('Unauthorized');

    // 1. Get plots for this shift
    const plots = await prisma.plotting.findMany({
        where: { shiftId },
        orderBy: { plotNo: 'asc' }
    });

    if (plots.length === 0) return { success: false, error: 'No plotting assistants found for this shift' };

    let plotIndex = 0;
    let assignedCount = 0;

    for (const nim of studentNims) {
        const student = await prisma.user.findUnique({ where: { username: nim } });
        if (!student) continue;

        // Round robin assignment
        const plot = plots[plotIndex % plots.length];
        
        try {
            await prisma.studentAssignment.create({
                data: {
                    shiftId,
                    studentId: student.id,
                    plottingId: plot.id
                }
            });
            assignedCount++;
            plotIndex++;
        } catch (e) {
            // Already assigned likely
        }
    }

    return { success: true, assignedCount };
}

