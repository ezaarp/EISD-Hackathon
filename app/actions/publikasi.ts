'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { TaskType, QuestionType, ContentType } from '@prisma/client';

export async function createContent(moduleWeekId: string, data: { title: string, type: ContentType, storagePath: string }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') throw new Error('Unauthorized');

    await prisma.content.create({
        data: {
            moduleWeekId,
            title: data.title,
            type: data.type,
            storagePath: data.storagePath,
            visibility: 'PUBLIC'
        }
    });
    revalidatePath(`/dashboard/publikasi/modules/${moduleWeekId}`);
}

export async function createTask(moduleWeekId: string, data: { title: string, type: TaskType, instructions: string }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') throw new Error('Unauthorized');

    await prisma.task.create({
        data: {
            moduleWeekId,
            title: data.title,
            type: data.type,
            instructions: data.instructions,
            allowCopyPaste: data.type === 'JURNAL' // Default config
        }
    });
    revalidatePath(`/dashboard/publikasi/modules/${moduleWeekId}`);
}

export async function createQuestion(taskId: string, data: { prompt: string, type: QuestionType, options?: string, correctAnswer: string, points: number }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') throw new Error('Unauthorized');

    const question = await prisma.question.create({
        data: {
            taskId,
            type: data.type,
            prompt: data.prompt,
            questionNo: 1, // Should calculate max + 1
            optionsJson: data.options || null,
            points: data.points
        }
    });

    await prisma.answerKey.create({
        data: {
            questionId: question.id,
            correctAnswer: data.correctAnswer
        }
    });

    revalidatePath(`/dashboard/publikasi/modules`); // Revalidate parent pages
}
