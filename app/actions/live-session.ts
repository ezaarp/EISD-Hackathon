'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionStatus, StageType, UserRole } from '@prisma/client';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Helper to broadcast event via Supabase Realtime
async function broadcastLiveEvent(liveSessionId: string, event: string, payload: any) {
  if (supabaseAdmin) {
    await supabaseAdmin.channel(`live-${liveSessionId}`).send({
      type: 'broadcast',
      event: event,
      payload: payload,
    });
  }
}

export async function getLiveSession(sessionId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  return await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      shift: {
        include: {
          course: true,
        },
      },
      moduleWeek: {
        include: {
            tasks: {
                include: {
                    questions: true
                }
            }
        }
      },
      stages: {
        orderBy: { stageOrder: 'asc' },
      },
      // currentStage relation does not exist, we use stages array
    },
  });
}

export async function createLiveSession(shiftId: string, moduleWeekId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !['PUBLIKASI', 'LABORAN', 'ADMIN'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  // Check if session already exists
  const existing = await prisma.liveSession.findFirst({
    where: {
      shiftId,
      moduleWeekId,
      status: { not: 'CANCELLED' },
    },
  });

  if (existing) {
    // If existing is Completed, allow creating a new one or restart logic?
    // User complained: "end sesi, habis itu logout dan login lagi. tiba tiba, tidak bisa melakukan start sesi lagi maupun end"
    // If status is COMPLETED, we should probably allow creating a NEW session for re-run or just fail.
    // But if status is ACTIVE/PAUSED/DRAFT, we return existing.
    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
       // Allow creating new session if previous is done
    } else {
       return { success: true, sessionId: existing.id };
    }
  }

  const newSession = await prisma.liveSession.create({
    data: {
      shiftId,
      moduleWeekId,
      status: 'DRAFT',
      controlledById: session.user.id,
    },
  });

  return { success: true, sessionId: newSession.id };
}

export async function startLiveSession(sessionId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !['PUBLIKASI'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  // Start with OPENING stage
  const liveSession = await prisma.liveSession.update({
    where: { id: sessionId },
    data: {
      status: 'ACTIVE',
      startedAt: new Date(),
      currentStageIndex: 0,
    },
  });

  // Create first stage record
  await prisma.liveStage.create({
    data: {
      liveSessionId: sessionId,
      type: 'OPENING',
      stageOrder: 0,
      durationSec: 600, // 10 mins default
      startedAt: new Date(),
    },
  });

  await broadcastLiveEvent(sessionId, 'session_start', { status: 'ACTIVE' });
  await broadcastLiveEvent(sessionId, 'stage_change', { stage: 'OPENING', index: 0 });

  revalidatePath(`/live/${sessionId}`);
  return { success: true };
}

export async function changeStage(sessionId: string, stageType: StageType, durationSec: number) {
    const session = await getServerSession(authOptions);
    if (!session || !['PUBLIKASI'].includes(session.user.role)) {
      throw new Error('Unauthorized');
    }

    const liveSession = await prisma.liveSession.findUnique({
        where: { id: sessionId },
        include: { stages: true }
    });

    if (!liveSession) throw new Error("Session not found");

    // End previous stage
    const currentStage = await prisma.liveStage.findFirst({
        where: {
            liveSessionId: sessionId,
            endedAt: null
        },
        orderBy: { stageOrder: 'desc' }
    });

    if (currentStage) {
        await prisma.liveStage.update({
            where: { id: currentStage.id },
            data: { endedAt: new Date() }
        });

        // AUTO-SUBMIT LOGIC
        const gradedTypes = ['PRETEST', 'JURNAL', 'POSTTEST'];
        if (gradedTypes.includes(currentStage.type)) {
             const sessionData = await prisma.liveSession.findUnique({
                 where: { id: sessionId },
                 select: { moduleWeekId: true }
             });
             
             if (sessionData) {
                 const taskTypeMap: Record<string, string> = {
                     'PRETEST': 'PRETEST',
                     'JURNAL': 'JURNAL',
                     'POSTTEST': 'POSTTEST'
                 };
                 
                 const taskType = taskTypeMap[currentStage.type];
                 // @ts-ignore
                 const task = await prisma.task.findFirst({
                     where: {
                         moduleWeekId: sessionData.moduleWeekId,
                         type: taskType as any
                     }
                 });

                 if (task) {
                     await prisma.submission.updateMany({
                         where: {
                             taskId: task.id,
                             status: 'DRAFT'
                         },
                         data: {
                             status: 'AUTOSUBMITTED',
                             submittedAt: new Date()
                         }
                     });
                 }
             }
        }
    }

    const nextIndex = liveSession.currentStageIndex + 1;

    // Create new stage
    const newStage = await prisma.liveStage.create({
        data: {
            liveSessionId: sessionId,
            type: stageType,
            stageOrder: nextIndex,
            durationSec: durationSec,
            startedAt: new Date(),
        }
    });

    await prisma.liveSession.update({
        where: { id: sessionId },
        data: { currentStageIndex: nextIndex }
    });

    await broadcastLiveEvent(sessionId, 'stage_change', { 
        stage: stageType, 
        index: nextIndex,
        duration: durationSec,
        startedAt: newStage.startedAt
    });
    
    revalidatePath(`/live/${sessionId}`);
    return { success: true };
}

export async function backStage(sessionId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PUBLIKASI') {
        throw new Error('Unauthorized');
    }

    const liveSession = await prisma.liveSession.findUnique({
        where: { id: sessionId },
        include: { stages: { orderBy: { stageOrder: 'desc' } } }
    });

    if (!liveSession || liveSession.currentStageIndex <= 0) {
        throw new Error('Cannot go back from first stage');
    }

    // End current stage
    const currentStage = liveSession.stages[0];
    if (currentStage && !currentStage.endedAt) {
        await prisma.liveStage.update({
            where: { id: currentStage.id },
            data: { endedAt: new Date() }
        });
    }

    // Go back one index
    const prevIndex = liveSession.currentStageIndex - 1;
    const prevStage = liveSession.stages.find(s => s.stageOrder === prevIndex);

    if (!prevStage) {
        throw new Error('Previous stage not found');
    }

    // Reopen previous stage
    await prisma.liveStage.update({
        where: { id: prevStage.id },
        data: { 
            endedAt: null,
            startedAt: new Date() // Restart timer
        }
    });

    await prisma.liveSession.update({
        where: { id: sessionId },
        data: { currentStageIndex: prevIndex }
    });

    await broadcastLiveEvent(sessionId, 'stage_change', {
        stage: prevStage.type,
        index: prevIndex,
        duration: prevStage.durationSec,
        startedAt: new Date()
    });

    revalidatePath(`/live/${sessionId}`);
    return { success: true };
}

export async function endLiveSession(sessionId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !['PUBLIKASI'].includes(session.user.role)) {
      throw new Error('Unauthorized');
    }

    await prisma.liveSession.update({
        where: { id: sessionId },
        data: { 
            status: 'COMPLETED',
            endedAt: new Date() 
        }
    });

     // End any active stage
     const currentStage = await prisma.liveStage.findFirst({
        where: {
            liveSessionId: sessionId,
            endedAt: null
        },
        orderBy: { stageOrder: 'desc' }
    });

    if (currentStage) {
        await prisma.liveStage.update({
            where: { id: currentStage.id },
            data: { endedAt: new Date() }
        });
    }

    await broadcastLiveEvent(sessionId, 'session_end', { status: 'COMPLETED' });
    revalidatePath(`/live/${sessionId}`);
    return { success: true };
}

export async function getActiveSessionForStudent(studentId: string) {
    // Find active session for the student's assigned shift
    const assignment = await prisma.studentAssignment.findFirst({
        where: { studentId },
        include: { shift: true }
    });

    if (!assignment) return null;

    const activeSession = await prisma.liveSession.findFirst({
        where: {
            shiftId: assignment.shiftId,
            status: 'ACTIVE'
        },
        include: {
            moduleWeek: true,
            stages: {
                orderBy: { stageOrder: 'desc' },
                take: 1
            }
        }
    });

    return activeSession;
}

