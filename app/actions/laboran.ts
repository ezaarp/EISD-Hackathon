'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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

    const baseData = {
        code: data.code,
        title: data.title,
        description: data.description,
        enrollPasswordHash: hashedPassword,
        semester: data.semester,
        academicYear: data.academicYear,
        createdById: session.user.id
    };

    try {
        await prisma.course.create({
            data: {
                ...baseData,
                // @ts-expect-error - optional column for plaintext display
                enrollPasswordPlain: data.enrollPassword
            }
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientValidationError && error.message.includes('enrollPasswordPlain')) {
            console.warn('[createCourse] enrollPasswordPlain column missing. Falling back to hashed-only storage. Run `npm run db:push` to sync schema.');
            await prisma.course.create({
                data: baseData
            });
        } else {
            throw error;
        }
    }

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

    try {
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
    } catch (error: any) {
        if (error?.code === 'P2002') {
            throw new Error('Shift number already exists for this course. Choose a different shift number.');
        }
        throw error;
    }

    revalidatePath('/dashboard/laboran/courses');
    return { success: true };
}

