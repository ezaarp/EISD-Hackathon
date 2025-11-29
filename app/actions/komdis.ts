'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AttendanceStatus, ViolationType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function markAttendance(liveSessionId: string, studentId: string, status: AttendanceStatus) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'KOMDIS') throw new Error('Unauthorized');

    await prisma.attendance.upsert({
        where: {
            liveSessionId_studentId: {
                liveSessionId,
                studentId
            }
        },
        update: {
            status,
            markedById: session.user.id,
            arrivedAt: status === 'PRESENT' || status === 'LATE' ? new Date() : null
        },
        create: {
            liveSessionId,
            studentId,
            status,
            markedById: session.user.id,
            arrivedAt: status === 'PRESENT' || status === 'LATE' ? new Date() : null
        }
    });

    // If LATE, maybe apply penalty?
    if (status === 'LATE') {
        // Apply penalty logic here if needed
    }

    revalidatePath(`/live/${liveSessionId}`); // Not really needed for dashboard
    return { success: true };
}

export async function reportViolation(studentId: string, type: ViolationType, points: number, description: string) {
    const session = await getServerSession(authOptions);
    if (!session || !['KOMDIS', 'ASISTEN'].includes(session.user.role)) throw new Error('Unauthorized');

    await prisma.violation.create({
        data: {
            studentId,
            type,
            points,
            description,
            reportedById: session.user.id,
            status: 'VERIFIED', // Direct verification if reported by Komdis
            verifiedById: session.user.id
        }
    });

    revalidatePath('/dashboard/komdis/violations');
    return { success: true };
}

