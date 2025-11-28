import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/supabase';
import { gradeMCQ, gradeCode } from '@/lib/grading';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PRAKTIKAN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const taskId = formData.get('taskId') as string;
        const evidenceFile = formData.get('evidence') as File;

        if (!taskId) {
            return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
        }

        // Get task with questions
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                questions: {
                    include: { answerKey: true },
                    orderBy: { questionNo: 'asc' }
                }
            }
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Upload evidence if provided
        let evidencePath = null;
        if (evidenceFile && evidenceFile.size > 0) {
            const buffer = Buffer.from(await evidenceFile.arrayBuffer());
            const path = `${session.user.id}/${taskId}/${Date.now()}-${evidenceFile.name}`;
            const { path: storagePath } = await uploadFile('evidence', path, buffer, {
                contentType: evidenceFile.type,
                upsert: true
            });
            evidencePath = storagePath;
        }

        let totalScore = 0;
        let maxScore = 0;

        // Process each question
        for (const question of task.questions) {
            const answer = formData.get(`question_${question.id}`);
            if (!answer) continue;

            maxScore += question.points;

            const answerText = answer.toString();

            // Create submission
            const submission = await prisma.submission.create({
                data: {
                    taskId,
                    questionId: question.id,
                    studentId: session.user.id,
                    answersJson: question.type === 'MCQ' ? JSON.stringify({ answer: answerText }) : undefined,
                    contentText: question.type === 'CODE' ? answerText : undefined,
                    evidencePdfPath: evidencePath,
                    status: 'SUBMITTED',
                    submittedAt: new Date()
                }
            });

            // Grade it
            if (question.answerKey) {
                let result;
                if (question.type === 'MCQ') {
                    result = gradeMCQ(answerText, question.answerKey);
                } else {
                    result = gradeCode(answerText, question.answerKey);
                }

                const pointsEarned = (result.score / 100) * question.points;
                totalScore += pointsEarned;

                await prisma.grade.create({
                    data: {
                        submissionId: submission.id,
                        score: result.score,
                        status: 'RECOMMENDED',
                        gradedByAI: true,
                        breakdownJson: JSON.stringify(result)
                    }
                });
            }
        }

        // If only evidence submission (no questions)
        if (task.questions.length === 0 && evidencePath) {
            await prisma.submission.create({
                data: {
                    taskId,
                    studentId: session.user.id,
                    evidencePdfPath: evidencePath,
                    status: 'SUBMITTED',
                    submittedAt: new Date()
                }
            });
        }

        return NextResponse.redirect(new URL(`/dashboard/praktikan/assignments/${taskId}`, req.url));
    } catch (error: any) {
        console.error('TP Submission error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

