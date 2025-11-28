'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { TaskType, QuestionType, ContentType } from '@prisma/client';
import { uploadFile } from '@/lib/supabase';

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

export async function uploadMaterial(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') throw new Error('Unauthorized');

    const file = formData.get('file') as File;
    const moduleWeekId = formData.get('moduleWeekId') as string;

    if (!file || !moduleWeekId) throw new Error('Missing file or moduleWeekId');

    // Convert to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a safe path
    // Use 'materials' bucket. Ensure it exists or change if needed.
    const path = `materials/${moduleWeekId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const { path: storagePath } = await uploadFile('materials', path, buffer, {
        contentType: file.type,
        upsert: true
    });

    return storagePath;
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

    // Calculate questionNo
    const lastQuestion = await prisma.question.findFirst({
        where: { taskId },
        orderBy: { questionNo: 'desc' }
    });
    const questionNo = (lastQuestion?.questionNo || 0) + 1;

    const question = await prisma.question.create({
        data: {
            taskId,
            type: data.type,
            prompt: data.prompt,
            questionNo, 
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
