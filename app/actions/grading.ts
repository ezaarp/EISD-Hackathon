'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GradeStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function finalizeGrade(submissionId: string, score: number, feedback: string, status: GradeStatus) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ASISTEN') throw new Error('Unauthorized');

    const submission = await prisma.submission.findUnique({ 
        where: { id: submissionId },
        include: { grade: true } 
    });

    if (!submission) throw new Error('Submission not found');

    if (submission.grade) {
        await prisma.grade.update({
            where: { id: submission.grade.id },
            data: {
                score,
                feedback,
                status,
                approvedById: session.user.id,
            }
        });
    } else {
        await prisma.grade.create({
            data: {
                submissionId,
                score,
                feedback,
                status,
                approvedById: session.user.id,
                breakdownJson: '{}',
                maxScore: 100
            }
        });
    }

    revalidatePath('/dashboard/asisten/grading');
    return { success: true };
}

