'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function deleteUser(userId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SEKRETARIS') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.user.delete({ where: { id: userId } });
        revalidatePath('/dashboard/sekretaris/users');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete user' };
    }
}

export async function updateUser(userId: string, data: { name: string, username: string }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SEKRETARIS') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                username: data.username
            }
        });
        revalidatePath('/dashboard/sekretaris/users');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update user' };
    }
}

