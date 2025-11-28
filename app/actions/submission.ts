'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gradeMCQ, gradeCode } from '@/lib/grading';
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

  let totalScore = 0;
  let maxScore = 0;

  // Process each question
  for (const question of task.questions) {
      const studentAnswer = answers[question.id];
      if (!studentAnswer) continue;

      maxScore += question.points;
      
      // Save submission
      const submission = await prisma.submission.create({
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

      // Grade it
      if (question.answerKey) {
          const result = gradeMCQ(studentAnswer, question.answerKey);
          const pointsEarned = (result.score / 100) * question.points;
          totalScore += pointsEarned;

          await prisma.grade.create({
              data: {
                  submissionId: submission.id,
                  score: result.score,
                  maxScore: 100, // Grade is 0-100 scale per question usually, or we store raw points?
                  // Let's store normalized 0-100 score for the Submission Grade
                  status: 'RECOMMENDED',
                  gradedByAI: true,
                  breakdownJson: JSON.stringify(result),
              }
          });
      }
  }

  return { success: true };
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

    // Grade it
    if (question.answerKey) {
        const result = gradeCode(code, question.answerKey);
        
        // Upsert grade
        const existingGrade = await prisma.grade.findUnique({
            where: { submissionId: submissionId! }
        });

        if (existingGrade) {
             await prisma.grade.update({
                where: { id: existingGrade.id },
                data: {
                    score: result.score,
                    status: 'RECOMMENDED',
                    gradedByAI: true,
                    breakdownJson: JSON.stringify(result)
                }
             });
        } else {
            await prisma.grade.create({
                data: {
                    submissionId: submissionId!,
                    score: result.score,
                    status: 'RECOMMENDED',
                    gradedByAI: true,
                    breakdownJson: JSON.stringify(result)
                }
            });
        }
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

    // Convert to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `${session.user.id}/${taskId}/${Date.now()}-${file.name}`;

    // Upload to 'evidence' bucket (private)
    const { path: storagePath } = await uploadFile('evidence', path, buffer, {
        contentType: file.type,
        upsert: true
    });

    // Find submission to update (or create if not exists)
    // Usually code submission exists as draft
    // We attach evidence to the first question submission of the task or creates a new one?
    // Schema has evidencePdfPath on Submission. A Task might have multiple questions (Jurnal usually has multiple numbers).
    // Usually evidence is ONE PDF for the whole Jurnal.
    // But our Submission model is per-question (questionId is optional?).
    // Let's see schema: questionId String?
    // So we can create a submission for the Task without a questionId specifically for the Evidence?
    // Or attach to the first question?
    // Best practice: Create a submission entry specifically for the evidence if it applies to the whole task.

    // Check if there is a "general" submission for this task (no questionId)
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
                status: 'SUBMITTED' // Evidence submitted
            }
        });
    }

    return { success: true };
}
