'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { uploadFile } from '@/lib/supabase';

export async function submitMCQ(taskId: string, answers: Record<string, string>, liveSessionId?: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { questions: { include: { answerKey: true } } }
  });

  if (!task) throw new Error('Task not found');

  // Process each question
  for (const question of task.questions) {
      const studentAnswer = answers[question.id];
      if (!studentAnswer) continue;

      // Save submission
      await prisma.submission.create({
          data: {
              taskId,
              questionId: question.id,
              studentId: session.user.id,
              liveSessionId,
              answersJson: JSON.stringify({ answer: studentAnswer }),
              status: 'SUBMITTED',
              submittedAt: new Date(),
          }
      });
  }

  return {
    success: true,
    score: 0,
    total: 100,
    pointsEarned: 0,
    maxPoints: task.questions.reduce((sum, q) => sum + q.points, 0)
  };
}

export async function submitCode(taskId: string, questionId: string, code: string, liveSessionId?: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');
  
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { answerKey: true }
    });

    if (!question) throw new Error('Question not found');

    // Create/Update Submission
    // Check if draft exists?
    const existing = await prisma.submission.findFirst({
        where: {
            taskId,
            questionId,
            studentId: session.user.id
        }
    });

    let submissionId = existing?.id;

    if (existing) {
        await prisma.submission.update({
            where: { id: existing.id },
            data: {
                contentText: code,
                status: 'SUBMITTED',
                submittedAt: new Date(),
                liveSessionId // Update session ID if needed
            }
        });
    } else {
        const sub = await prisma.submission.create({
            data: {
                taskId,
                questionId,
                studentId: session.user.id,
                liveSessionId,
                contentText: code,
                status: 'SUBMITTED',
                submittedAt: new Date(),
            }
        });
        submissionId = sub.id;
    }

    revalidatePath('/live');
    return { success: true };
}

export async function uploadEvidence(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');

    const file = formData.get('file') as File;
    const taskId = formData.get('taskId') as string;
    const liveSessionId = formData.get('liveSessionId') as string;

    if (!file || !taskId) throw new Error('Missing required fields');

    // Validate file
    if (file.size === 0) {
        throw new Error('File is empty');
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
    }

    // Convert to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `${session.user.id}/${taskId}/${Date.now()}-${file.name}`;

    // Upload to 'evidence' bucket (private)
    const { path: storagePath } = await uploadFile('evidence', path, buffer, {
        contentType: file.type,
        upsert: true
    });

    // Try to find existing code submission first (with questionId)
    const codeSubmission = await prisma.submission.findFirst({
        where: {
            taskId,
            studentId: session.user.id,
            questionId: { not: null }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (codeSubmission) {
        // Attach PDF to existing code submission
        await prisma.submission.update({
            where: { id: codeSubmission.id },
            data: {
                evidencePdfPath: storagePath,
                liveSessionId: liveSessionId || codeSubmission.liveSessionId
            }
        });
    } else {
        // No code submission yet, create standalone evidence submission
        let submission = await prisma.submission.findFirst({
            where: {
                taskId,
                questionId: null,
                studentId: session.user.id
            }
        });

        if (submission) {
            await prisma.submission.update({
                where: { id: submission.id },
                data: { evidencePdfPath: storagePath, liveSessionId }
            });
        } else {
            await prisma.submission.create({
                data: {
                    taskId,
                    studentId: session.user.id,
                    liveSessionId,
                    evidencePdfPath: storagePath,
                    status: 'SUBMITTED'
                }
            });
        }
    }

    revalidatePath('/dashboard/asisten/grading');
    return { success: true };
}
