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

        console.log('Create session data:', { shiftId, moduleWeekId, controlledById, hasRundown: !!rundownStr });

        if (!shiftId || !moduleWeekId || !rundownStr) {
            console.error('Missing fields:', { shiftId: !!shiftId, moduleWeekId: !!moduleWeekId, rundownStr: !!rundownStr });
            return NextResponse.json({ error: 'Missing required fields: shift, module, or rundown' }, { status: 400 });
        }

        const rundown = JSON.parse(rundownStr);
        console.log('Parsed rundown:', rundown);

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
            console.log('Uploading TP presentation:', tpPresentationFile.name, 'size:', tpPresentationFile.size);
            try {
                const buffer = Buffer.from(await tpPresentationFile.arrayBuffer());
                const path = `presentations/tp-${Date.now()}-${tpPresentationFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

                const { path: storagePath } = await uploadFile('materials', path, buffer, {
                    contentType: 'application/pdf',
                    upsert: true
                });
                tpPresentationPath = storagePath;
                console.log('TP presentation uploaded:', storagePath);
            } catch (uploadError: any) {
                console.error('Error uploading TP presentation:', uploadError);
                return NextResponse.json({ error: `Failed to upload TP presentation: ${uploadError.message}` }, { status: 500 });
            }
        }

        // Upload JURNAL presentation if provided
        let jurnalPresentationPath = null;
        if (jurnalPresentationFile && jurnalPresentationFile.size > 0) {
            console.log('Uploading Jurnal presentation:', jurnalPresentationFile.name, 'size:', jurnalPresentationFile.size);
            try {
                const buffer = Buffer.from(await jurnalPresentationFile.arrayBuffer());
                const path = `presentations/jurnal-${Date.now()}-${jurnalPresentationFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

                const { path: storagePath } = await uploadFile('materials', path, buffer, {
                    contentType: 'application/pdf',
                    upsert: true
                });
                jurnalPresentationPath = storagePath;
                console.log('Jurnal presentation uploaded:', storagePath);
            } catch (uploadError: any) {
                console.error('Error uploading Jurnal presentation:', uploadError);
                return NextResponse.json({ error: `Failed to upload Jurnal presentation: ${uploadError.message}` }, { status: 500 });
            }
        }

        // Create the live session
        console.log('Creating live session with data:', {
            shiftId,
            moduleWeekId,
            controlledById,
            hasTpPresentation: !!tpPresentationPath,
            hasJurnalPresentation: !!jurnalPresentationPath
        });

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

        console.log('Live session created successfully:', liveSession.id);

        return NextResponse.json({
            success: true,
            liveSessionId: liveSession.id
        });
    } catch (error: any) {
        console.error('Create live session error:', error);
        console.error('Error stack:', error.stack);

        // Provide more specific error messages
        let errorMessage = error.message || 'Unknown error occurred';

        if (error.code === 'P2002') {
            errorMessage = 'A session with these details already exists';
        } else if (error.code === 'P2003') {
            errorMessage = 'Invalid shift or module reference';
        } else if (error.message?.includes('Unknown argument')) {
            errorMessage = 'Database schema mismatch. Please restart the dev server and try again.';
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

