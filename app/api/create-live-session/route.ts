import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StageType } from '@prisma/client';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { shiftId, moduleWeekId, controlledById, rundown } = await req.json();

        if (!shiftId || !moduleWeekId || !rundown) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

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

        // Create the live session
        const liveSession = await prisma.liveSession.create({
            data: {
                shiftId,
                moduleWeekId,
                controlledById,
                status: 'DRAFT',
                currentStageIndex: 0
            }
        });

        // Store rundown as JSON in notes field (or create a new RundownConfig table if needed)
        // For now, we'll just create the session and the client will manage stages
        await prisma.liveSession.update({
            where: { id: liveSession.id },
            data: {
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

