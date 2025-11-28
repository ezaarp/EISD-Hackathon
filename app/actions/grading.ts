'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateGrade(submissionId: string, score: number, notes: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ASISTEN') {
        throw new Error('Unauthorized');
    }

    // Check if grade exists
    const existingGrade = await prisma.grade.findUnique({
        where: { submissionId }
    });

    if (existingGrade) {
        await prisma.grade.update({
            where: { id: existingGrade.id },
            data: {
                score,
                notes,
                status: 'PENDING'
            }
        });
    } else {
        await prisma.grade.create({
            data: {
                submission: { connect: { id: submissionId } },
                score,
                notes,
                status: 'PENDING',
                breakdownJson: "{}"
            }
        });
    }

    revalidatePath(`/dashboard/asisten/grading/${submissionId}`);
    return { success: true };
}

export async function approveGrade(submissionId: string, finalScore?: number, finalNotes?: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ASISTEN') {
        throw new Error('Unauthorized');
    }

    let grade = await prisma.grade.findUnique({
        where: { submissionId },
        include: { submission: true }
    });

    if (!grade) {
        // Create grade if it doesn't exist
        grade = await prisma.grade.create({
            data: {
                submission: { connect: { id: submissionId } },
                score: finalScore ?? 0,
                notes: finalNotes ?? '',
                status: 'PENDING',
                breakdownJson: "{}"
            },
            include: { submission: true }
        });
    }

    await prisma.grade.update({
        where: { id: grade.id },
        data: {
            score: finalScore !== undefined ? finalScore : grade.score,
            notes: finalNotes !== undefined ? finalNotes : grade.notes,
            status: 'APPROVED',
            approvedById: session.user.id,
            approvedAt: new Date()
        }
    });

    // Update submission status
    await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'GRADED' }
    });

    revalidatePath(`/dashboard/asisten/grading/${submissionId}`);
    revalidatePath('/dashboard/asisten/grading');
    return { success: true };
}

export async function rejectGrade(submissionId: string, reason: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ASISTEN') {
        throw new Error('Unauthorized');
    }

    let grade = await prisma.grade.findUnique({
        where: { submissionId }
    });

    if (!grade) {
        // Create grade if it doesn't exist
        grade = await prisma.grade.create({
            data: {
                submission: { connect: { id: submissionId } },
                score: 0,
                notes: reason,
                status: 'PENDING',
                breakdownJson: "{}"
            }
        });
    }

    await prisma.grade.update({
        where: { id: grade.id },
        data: {
            status: 'REJECTED',
            notes: reason,
            approvedById: session.user.id,
            approvedAt: new Date()
        }
    });

    revalidatePath(`/dashboard/asisten/grading/${submissionId}`);
    revalidatePath('/dashboard/asisten/grading');
    return { success: true };
}
