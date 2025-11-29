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

export async function deleteUser(userId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SEKRETARIS') throw new Error('Unauthorized');

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/dashboard/sekretaris/users');
    return { success: true };
}

export async function getShiftsAndAssistants() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SEKRETARIS') throw new Error('Unauthorized');

    const shifts = await prisma.shift.findMany({
        include: { 
            course: true, 
            plottings: { 
                include: { 
                    assistant: true,
                    studentAssignments: {
                        include: {
                            student: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true
                                }
                            }
                        }
                    } // Include assignments + student data
                } 
            } 
        },
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
        include: { studentAssignments: true },
        orderBy: { plotNo: 'asc' }
    });

    if (plots.length === 0) return { success: false, error: 'No plotting assistants found for this shift' };

    let assignedCount = 0;
    const MAX_STUDENTS_PER_PLOT = 7;

    for (const nim of studentNims) {
        const student = await prisma.user.findUnique({ where: { username: nim } });
        if (!student) continue;

        // Find plot with least students < 7
        const availablePlots = plots.filter(p => p.studentAssignments.length < MAX_STUDENTS_PER_PLOT);
        
        if (availablePlots.length === 0) {
            // All full
            continue;
        }

        // Sort by current count ascending
        availablePlots.sort((a, b) => a.studentAssignments.length - b.studentAssignments.length);
        const targetPlot = availablePlots[0];

        try {
            await prisma.studentAssignment.create({
                data: {
                    shiftId,
                    studentId: student.id,
                    plottingId: targetPlot.id
                }
            });
            // Update local count for next iteration
            targetPlot.studentAssignments.push({} as any);
            assignedCount++;
        } catch (e) {
            // Already assigned likely
        }
    }

    return { success: true, assignedCount };
}

export async function updateStudentAssignment(assignmentId: string, newPlottingId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SEKRETARIS') throw new Error('Unauthorized');

    await prisma.studentAssignment.update({
        where: { id: assignmentId },
        data: { plottingId: newPlottingId }
    });

    revalidatePath('/dashboard/sekretaris/plotting');
    return { success: true };
}

export async function deletePlotting(plottingId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SEKRETARIS') throw new Error('Unauthorized');

    await prisma.plotting.delete({
        where: { id: plottingId }
    });

    revalidatePath('/dashboard/sekretaris/plotting');
    return { success: true };
}
