'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { QuestionType, ContentType } from '@prisma/client';
import { uploadFile, deleteFile } from '@/lib/supabase';

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
    const path = `${moduleWeekId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const { path: storagePath } = await uploadFile('materials', path, buffer, {
        contentType: file.type,
        upsert: true
    });

    return storagePath;
}

// Upload helper for task files
export async function uploadTaskFile(file: File, moduleWeekId: string) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `${moduleWeekId}/tasks/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const { path: storagePath } = await uploadFile('materials', path, buffer, {
        contentType: file.type,
        upsert: true
    });
    return storagePath;
}

export async function createTask(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') throw new Error('Unauthorized');

    const moduleWeekId = formData.get('moduleWeekId') as string;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const instructions = formData.get('instructions') as string;
    
    const instructionFile = formData.get('instructionFile') as File | null;
    const templateFile = formData.get('templateFile') as File | null;

    let instructionPath = null;
    let templatePath = null;

    if (instructionFile && instructionFile.size > 0) {
        instructionPath = await uploadTaskFile(instructionFile, moduleWeekId);
    }

    if (templateFile && templateFile.size > 0) {
        templatePath = await uploadTaskFile(templateFile, moduleWeekId);
    }

    await prisma.task.create({
        data: {
            moduleWeekId,
            title,
            type, // String type now
            instructions,
            instructionPath,
            templatePath,
            allowCopyPaste: type.toUpperCase() === 'JURNAL' 
        }
    });
    revalidatePath(`/dashboard/publikasi/modules/${moduleWeekId}`);
}

export async function updateTask(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') throw new Error('Unauthorized');

    const taskId = formData.get('taskId') as string;
    if (!taskId) throw new Error('Task ID is required');

    const title = formData.get('title') as string;
    const instructions = formData.get('instructions') as string;
    const type = formData.get('type') as string | null;

    await prisma.task.update({
        where: { id: taskId },
        data: {
            title,
            instructions,
            ...(type ? { type } : {})
        }
    });

    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { moduleWeekId: true } });
    if (task) {
        revalidatePath(`/dashboard/publikasi/modules/${task.moduleWeekId}`);
    }
}

export async function deleteTask(taskId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') throw new Error('Unauthorized');

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    await prisma.task.delete({ where: { id: taskId } });
    revalidatePath(`/dashboard/publikasi/modules/${task.moduleWeekId}`);
}

export async function deleteContent(contentId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') throw new Error('Unauthorized');

    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw new Error('Content not found');

    await prisma.content.delete({ where: { id: contentId } });
    revalidatePath(`/dashboard/publikasi/modules/${content.moduleWeekId}`);
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

    revalidatePath(`/dashboard/publikasi/modules`); 
}

export async function updateQuestion(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') throw new Error('Unauthorized');

    const questionId = formData.get('questionId') as string;
    if (!questionId) throw new Error('Question ID is required');

    const prompt = formData.get('prompt') as string;
    const correctAnswer = formData.get('correctAnswer') as string;
    const points = parseFloat((formData.get('points') as string) || '0');
    const optionsValue = formData.get('options');
    const options = typeof optionsValue === 'string' ? optionsValue : '';

    await prisma.question.update({
        where: { id: questionId },
        data: {
            prompt,
            points,
            optionsJson: options || null
        }
    });

    await prisma.answerKey.update({
        where: { questionId },
        data: {
            correctAnswer
        }
    });

    const question = await prisma.question.findUnique({ where: { id: questionId }, select: { task: { select: { moduleWeekId: true } } } });
    if (question?.task.moduleWeekId) {
        revalidatePath(`/dashboard/publikasi/modules/${question.task.moduleWeekId}`);
    }
}

// Server action to start a TP (Tugas Pendahuluan) - Opens it for students
export async function startTP(moduleWeekId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') throw new Error('Unauthorized');

    // Update all TP tasks in this module to be "open"
    // We could add an `isOpen` or `startedAt` field to Task, but for simplicity:
    // Create a SystemSetting or LiveSession-like flag.
    // For hackathon, we'll use Announcement as a signal.
    
    const module = await prisma.moduleWeek.findUnique({
        where: { id: moduleWeekId },
        include: { course: true }
    });

    if (!module) throw new Error('Module not found');

    // Create an announcement to signal TP is open
    await prisma.announcement.create({
        data: {
            courseId: module.courseId,
            title: `TP Week ${module.weekNo} is Now OPEN`,
            body: `Tugas Pendahuluan untuk ${module.title} sudah dibuka. Silakan submit sebelum deadline.`,
            createdById: session.user.id,
            isPinned: true
        }
    });

    revalidatePath('/dashboard/publikasi/modules');
    revalidatePath('/dashboard/praktikan');
    return { success: true };
}

export async function createModuleWeek(data: {
    courseId: string;
    weekNo: number;
    title: string;
    description?: string | null;
    releaseAt: Date;
    deadlineTP?: Date | null;
}) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') throw new Error('Unauthorized');

    if (!data.courseId || !data.weekNo || !data.title || !data.releaseAt) {
        throw new Error('Missing required fields');
    }

    await prisma.moduleWeek.create({
        data: {
            courseId: data.courseId,
            weekNo: data.weekNo,
            title: data.title,
            description: data.description || null,
            releaseAt: data.releaseAt,
            deadlineTP: data.deadlineTP || null,
            hasCodeBased: false,
            hasMCQ: false,
            hasUploadOnly: false,
        },
    });

    revalidatePath('/dashboard/publikasi/modules');
}