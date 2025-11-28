'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function createAssistant(data: {
    name: string;
    username: string; // Code Asprak
    nim: string;
    email?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'KOORDINATOR') return { success: false, error: 'Unauthorized' };

    try {
        const existing = await prisma.user.findUnique({ where: { username: data.username } });
        if (existing) return { success: false, error: 'Username already exists' };

        const passwordHash = await bcrypt.hash('password123', 10); // Default password

        await prisma.user.create({
            data: {
                username: data.username,
                name: data.name,
                nim: data.nim,
                role: 'ASISTEN',
                email: data.email,
                passwordHash
            }
        });

        revalidatePath('/dashboard/koordinator/assistants');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to create assistant' };
    }
}

