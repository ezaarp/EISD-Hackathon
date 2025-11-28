'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadFile } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

async function broadcastSlideChange(sessionId: string, slideNumber: number) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.channel(`live-${sessionId}`)
        .send({
            type: 'broadcast',
            event: 'slide_change',
            payload: { slide: slideNumber }
        });
}

export async function uploadPresentation(liveSessionId: string, formData: FormData, type: 'TP' | 'JURNAL') {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') {
        throw new Error('Unauthorized');
    }

    const fieldName = type === 'TP' ? 'tpPresentation' : 'jurnalPresentation';
    const file = formData.get(fieldName);

    // Validate file exists and is a File object
    if (!file || !(file instanceof File)) {
        throw new Error('No file uploaded');
    }

    // Validate file is not empty
    if (file.size === 0) {
        throw new Error('File is empty');
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
        throw new Error('Please upload a PDF file');
    }

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `presentations/${liveSessionId}/${type.toLowerCase()}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { path: storagePath } = await uploadFile('materials', path, buffer, {
        contentType: 'application/pdf',
        upsert: true
    });

    // Update live session
    const updateData = type === 'TP'
        ? { tpReviewPresentationPath: storagePath, tpReviewCurrentSlide: 1 }
        : { jurnalReviewPresentationPath: storagePath, jurnalReviewCurrentSlide: 1 };

    await prisma.liveSession.update({
        where: { id: liveSessionId },
        data: updateData
    });

    revalidatePath(`/live/${liveSessionId}/controller`);
    return { success: true, path: storagePath };
}

export async function changeSlide(liveSessionId: string, slideNumber: number, type: 'TP' | 'JURNAL') {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') {
        throw new Error('Unauthorized');
    }

    const updateData = type === 'TP' 
        ? { tpReviewCurrentSlide: slideNumber }
        : { jurnalReviewCurrentSlide: slideNumber };

    await prisma.liveSession.update({
        where: { id: liveSessionId },
        data: updateData
    });

    await broadcastSlideChange(liveSessionId, slideNumber);
    
    revalidatePath(`/live/${liveSessionId}/controller`);
    return { success: true };
}

export async function updateLiveSession(liveSessionId: string, data: {
    shiftId?: string;
    moduleWeekId?: string;
    notes?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') {
        throw new Error('Unauthorized');
    }

    await prisma.liveSession.update({
        where: { id: liveSessionId },
        data
    });

    revalidatePath(`/live/${liveSessionId}/controller`);
    revalidatePath('/dashboard/publikasi/live-session');
    return { success: true };
}

