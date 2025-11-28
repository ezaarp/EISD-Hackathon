'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function createCourse(data: {
    code: string;
    title: string;
    description: string;
    enrollPassword: string;
    semester: string;
    academicYear: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'LABORAN') throw new Error('Unauthorized');

    const hashedPassword = await bcrypt.hash(data.enrollPassword, 10);

    await prisma.course.create({
        data: {
            code: data.code,
            title: data.title,
            description: data.description,
            enrollPasswordHash: hashedPassword,
            semester: data.semester,
            academicYear: data.academicYear,
            createdById: session.user.id
        }
    });

    revalidatePath('/dashboard/laboran/courses');
    return { success: true };
}

export async function createShift(courseId: string, data: {
    shiftNo: number;
    name: string;
    day: string;
    startTime: string;
    endTime: string;
    room: string;
    maxCapacity: number;
}) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'LABORAN') throw new Error('Unauthorized');

    await prisma.shift.create({
        data: {
            courseId,
            shiftNo: data.shiftNo,
            name: data.name,
            day: data.day,
            startTime: data.startTime,
            endTime: data.endTime,
            room: data.room,
            maxCapacity: data.maxCapacity
        }
    });

    revalidatePath('/dashboard/laboran/courses');
    return { success: true };
}

