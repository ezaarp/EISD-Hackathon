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

  // Calculate score
  let totalPoints = 0;
  let earnedPoints = 0;
  const processedAnswers: any[] = [];

  const normalize = (value?: string | null) => (typeof value === 'string' ? value.trim() : '');
  const parseOptions = (optionsJson?: string | null): string[] => {
      if (!optionsJson) return [];
      try {
          const parsed = JSON.parse(optionsJson);
          if (Array.isArray(parsed)) {
              return parsed.map((opt) => (typeof opt === 'string' ? opt : String(opt)));
          }
      } catch (error) {
          console.warn('Failed to parse options JSON', error);
      }
      return [];
  };

  for (const question of task.questions) {
      const studentAnswer = normalize(answers[question.id]);
      const points = question.points || 10; // Default points if not set
      totalPoints += points;

      if (studentAnswer) {
          const rawAnswerKey = normalize(question.answerKey?.correctAnswer);
          let isCorrect = false;

          if (rawAnswerKey) {
              // Primary: compare raw strings (covers numeric indexes stored as strings)
              if (rawAnswerKey === studentAnswer) {
                  isCorrect = true;
              } else {
                  const options = parseOptions(question.optionsJson);
                  const studentIndex = Number(studentAnswer);

                  // If answer key stored as option text, compare selected option text
                  if (!Number.isNaN(studentIndex) && options[studentIndex]) {
                      const selectedOption = normalize(options[studentIndex]);
                      if (selectedOption && selectedOption.toLowerCase() === rawAnswerKey.toLowerCase()) {
                          isCorrect = true;
                      }
                  }

                  // If answer key stored as letter (A, B, C...), map to index
                  if (!isCorrect && /^[A-Za-z]$/.test(rawAnswerKey) && !Number.isNaN(studentIndex)) {
                      const letterIndex = rawAnswerKey.toUpperCase().charCodeAt(0) - 65;
                      if (letterIndex === studentIndex) {
                          isCorrect = true;
                      }
                  }
              }
          }

          if (isCorrect) {
              earnedPoints += points;
          }
          
          processedAnswers.push({
              questionId: question.id,
              answer: studentAnswer,
              isCorrect
          });
      }
  }

  const finalScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

  // Check for existing submission for this TASK (not per question)
  const existingSubmission = await prisma.submission.findFirst({
      where: {
          taskId,
          studentId: session.user.id,
          questionId: null // Task-level submission
      }
  });

  let submissionId = existingSubmission?.id;

  if (existingSubmission) {
      await prisma.submission.update({
          where: { id: existingSubmission.id },
          data: {
              answersJson: JSON.stringify(processedAnswers),
              status: 'GRADED',
              submittedAt: new Date(),
              liveSessionId
          }
      });
  } else {
      const sub = await prisma.submission.create({
          data: {
              taskId,
              studentId: session.user.id,
              liveSessionId,
              answersJson: JSON.stringify(processedAnswers),
              status: 'GRADED',
              submittedAt: new Date(),
              questionId: null
          }
      });
      submissionId = sub.id;
  }

  // Create or Update Grade immediately
  const existingGrade = await prisma.grade.findUnique({
      where: { submissionId: submissionId! }
  });

  const gradeData = {
    score: finalScore,
    status: 'RECOMMENDED' as const,
    gradedByAI: true,
    notes: 'Auto-graded MCQ',
    breakdownJson: JSON.stringify(processedAnswers),
  };

  if (existingGrade) {
    await prisma.grade.update({
      where: { id: existingGrade.id },
      data: gradeData,
    });
  } else {
    await prisma.grade.create({
      data: {
        submission: { connect: { id: submissionId! } },
        ...gradeData,
      },
    });
  }

  return {
    success: true,
    score: finalScore,
    total: 100,
    pointsEarned: earnedPoints,
    maxPoints: totalPoints
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

    // Try to find existing code submission first
    // Priority 1: Find by liveSessionId and questionId (most specific)
    let codeSubmission = liveSessionId ? await prisma.submission.findFirst({
        where: {
            taskId,
            studentId: session.user.id,
            liveSessionId,
            questionId: { not: null }
        },
        orderBy: { createdAt: 'desc' }
    }) : null;

    // Priority 2: Find any submission with questionId for this task
    if (!codeSubmission) {
        codeSubmission = await prisma.submission.findFirst({
            where: {
                taskId,
                studentId: session.user.id,
                questionId: { not: null }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    if (codeSubmission) {
        // Attach PDF to existing code submission
        await prisma.submission.update({
            where: { id: codeSubmission.id },
            data: {
                evidencePdfPath: storagePath,
                liveSessionId: liveSessionId || codeSubmission.liveSessionId,
                status: 'SUBMITTED',
                submittedAt: codeSubmission.submittedAt || new Date()
            }
        });
    } else {
        // No code submission found - this shouldn't normally happen for JURNAL tasks
        // Create minimal submission with just the PDF
        await prisma.submission.create({
            data: {
                taskId,
                studentId: session.user.id,
                liveSessionId,
                evidencePdfPath: storagePath,
                status: 'SUBMITTED',
                submittedAt: new Date()
            }
        });
    }

    revalidatePath('/dashboard/asisten/grading');
    return { success: true };
}
