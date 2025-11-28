import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StageType } from '@prisma/client';
import { uploadFile } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const shiftId = formData.get('shiftId') as string;
        const moduleWeekId = formData.get('moduleWeekId') as string;
        const controlledById = formData.get('controlledById') as string;
        const rundownStr = formData.get('rundown') as string;
        const tpPresentationFile = formData.get('tpPresentation') as File | null;
        const jurnalPresentationFile = formData.get('jurnalPresentation') as File | null;

        if (!shiftId || !moduleWeekId || !rundownStr) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const rundown = JSON.parse(rundownStr);

        // Check if there's an existing active/draft session for this shift
        const existingSession = await prisma.liveSession.findFirst({
            where: {
                shiftId,
                status: { in: ['DRAFT', 'ACTIVE'] }
            }
        });

        if (existingSession) {
            return NextResponse.json({ 
                error: 'Active or draft session already exists for this shift' 
            }, { status: 400 });
        }

        // Upload TP presentation if provided
        let tpPresentationPath = null;
        if (tpPresentationFile && tpPresentationFile.size > 0) {
            const buffer = Buffer.from(await tpPresentationFile.arrayBuffer());
            const path = `presentations/tp-${Date.now()}-${tpPresentationFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            
            const { path: storagePath } = await uploadFile('materials', path, buffer, {
                contentType: 'application/pdf',
                upsert: true
            });
            tpPresentationPath = storagePath;
        }

        // Upload JURNAL presentation if provided
        let jurnalPresentationPath = null;
        if (jurnalPresentationFile && jurnalPresentationFile.size > 0) {
            const buffer = Buffer.from(await jurnalPresentationFile.arrayBuffer());
            const path = `presentations/jurnal-${Date.now()}-${jurnalPresentationFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            
            const { path: storagePath } = await uploadFile('materials', path, buffer, {
                contentType: 'application/pdf',
                upsert: true
            });
            jurnalPresentationPath = storagePath;
        }

        // Create the live session
        const liveSession = await prisma.liveSession.create({
            data: {
                shiftId,
                moduleWeekId,
                controlledById,
                status: 'DRAFT',
                currentStageIndex: 0,
                tpReviewPresentationPath: tpPresentationPath,
                tpReviewCurrentSlide: 1,
                jurnalReviewPresentationPath: jurnalPresentationPath,
                jurnalReviewCurrentSlide: 1,
                notes: JSON.stringify({
                    rundown: rundown.map((stage: any, index: number) => ({
                        order: index,
                        type: stage.type as StageType,
                        durationSec: stage.durationMinutes * 60
                    }))
                })
            }
        });

        return NextResponse.json({ 
            success: true, 
            liveSessionId: liveSession.id 
        });
    } catch (error: any) {
        console.error('Create live session error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

