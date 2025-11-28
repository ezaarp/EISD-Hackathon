import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import prisma from '@/lib/prisma';
import { finalizeGrade } from '@/app/actions/grading';
import { CheckCircle, XCircle } from 'lucide-react';

export default async function GradingDetailPage(props: { params: Promise<{ submissionId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ASISTEN') {
    redirect('/login');
  }

  const submission = await prisma.submission.findUnique({
    where: { id: params.submissionId },
    include: {
      student: true,
      grade: true,
      task: {
        include: {
            questions: { include: { answerKey: true } }
        }
      },
    },
  });

  if (!submission) return <div>Submission not found</div>;

  return (
    <DashboardLayout user={session.user} navItems={[{ href: '/dashboard/asisten/grading', label: 'Back to Queue', icon: 'ArrowLeft' }]}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">GRADING SUBMISSION</h1>
        <p className="text-slate-400">
            {submission.task.title} - {submission.student.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
              <PixelCard title="SUBMISSION CONTENT">
                  {submission.contentText ? (
                      <pre className="bg-slate-950 p-4 rounded overflow-x-auto font-mono text-sm text-emerald-400 border-2 border-slate-700">
                          {submission.contentText}
                      </pre>
                  ) : (
                      <div className="p-4 bg-slate-800 text-slate-400">
                          No text content (MCQ or File Upload)
                      </div>
                  )}

                  {submission.answersJson && (
                      <div className="mt-4">
                          <h3 className="font-bold mb-2">MCQ Answers</h3>
                          <pre className="bg-slate-900 p-2 text-xs text-slate-300">
                              {submission.answersJson}
                          </pre>
                      </div>
                  )}
              </PixelCard>

              {submission.grade?.breakdownJson && (
                  <PixelCard title="AI GRADING BREAKDOWN" color="bg-indigo-900/20">
                      <pre className="text-xs text-indigo-300 whitespace-pre-wrap">
                          {JSON.stringify(JSON.parse(submission.grade.breakdownJson), null, 2)}
                      </pre>
                  </PixelCard>
              )}
          </div>

          <div className="space-y-6">
              <PixelCard title="GRADING FORM">
                  <form action={async (formData) => {
                      'use server';
                      const score = parseFloat(formData.get('score') as string);
                      const feedback = formData.get('feedback') as string;
                      const action = formData.get('action') as string;
                      
                      await finalizeGrade(
                          submission.id, 
                          score, 
                          feedback, 
                          action === 'approve' ? 'APPROVED' : 'REJECTED'
                      );
                      redirect('/dashboard/asisten/grading');
                  }}>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold mb-2">SCORE (0-100)</label>
                              <input 
                                  type="number" 
                                  name="score" 
                                  defaultValue={submission.grade?.score || 0}
                                  className="w-full bg-slate-900 border-2 border-slate-600 p-2 text-white font-pixel"
                              />
                          </div>
                          
                          <div>
                              <label className="block text-xs font-bold mb-2">FEEDBACK</label>
                              <textarea 
                                  name="feedback" 
                                  rows={4}
                                  defaultValue={submission.grade?.feedback || ''}
                                  className="w-full bg-slate-900 border-2 border-slate-600 p-2 text-white text-sm"
                              ></textarea>
                          </div>

                          <div className="flex gap-2 pt-4">
                              <button 
                                  type="submit" 
                                  name="action" 
                                  value="approve"
                                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-pixel py-3 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1"
                              >
                                  APPROVE
                              </button>
                              <button 
                                  type="submit" 
                                  name="action" 
                                  value="reject"
                                  className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-pixel py-3 border-b-4 border-rose-700 active:border-b-0 active:translate-y-1"
                              >
                                  REJECT
                              </button>
                          </div>
                      </div>
                  </form>
              </PixelCard>
          </div>
      </div>
    </DashboardLayout>
  );
}

