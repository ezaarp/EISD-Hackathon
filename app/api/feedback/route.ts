import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { liveSessionId, rating, comment, type } = await req.json();

        if (!liveSessionId || !rating) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get the live session to find the assistant
        const liveSession = await prisma.liveSession.findUnique({
            where: { id: liveSessionId },
            include: {
                shift: {
                    include: {
                        plottings: {
                            include: {
                                assistant: true
                            }
                        }
                    }
                }
            }
        });

        if (!liveSession) {
            return NextResponse.json({ error: 'Live session not found' }, { status: 404 });
        }

        // Find the assistant for this student
        const plotting = liveSession.shift.plottings.find(p => p.assistantId);
        const targetId = plotting?.assistantId || liveSession.shift.id;

        // Create rating/feedback
        await prisma.rating.create({
            data: {
                studentId: session.user.id,
                type: type || 'PRAKTIKUM',
                targetId: targetId,
                stars: rating,
                comment: comment || '',
                liveSessionId: liveSessionId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Feedback error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

