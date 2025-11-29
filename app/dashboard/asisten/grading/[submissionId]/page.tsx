import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { getFileUrl } from '@/lib/supabase';
import GradingForm from './_components/GradingForm';

export default async function SubmissionDetailPage(props: { params: Promise<{ submissionId: string }> }) {
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
          moduleWeek: {
            include: {
              course: true
            }
          },
          questions: true
        }
      },
      question: {
        include: {
          answerKey: true
        }
      }
    }
  });

  if (!submission) {
    return <div>Submission not found</div>;
  }

  // Check if this student is under this assistant
  const hasAccess = await prisma.plotting.findFirst({
    where: {
      assistantId: session.user.id,
      studentAssignments: {
        some: {
          studentId: submission.studentId
        }
      }
    }
  });

  if (!hasAccess) {
    return <div>Access denied</div>;
  }

  const navItems = [
    { href: '/dashboard/asisten', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/asisten/students', label: 'Students', icon: 'Users' },
    { href: '/dashboard/asisten/grading', label: 'Grading', icon: 'FileText' },
    { href: '/dashboard/asisten/feedback', label: 'Feedback', icon: 'MessageSquare' },
  ];

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8 flex items-center gap-4">
        <PixelButton href="/dashboard/asisten/grading" variant="outline" className="w-12 flex justify-center">
          <ArrowLeft size={20} />
        </PixelButton>
        <div>
          <h1 className="text-3xl font-pixel text-white mb-2">GRADE SUBMISSION</h1>
          <p className="text-slate-400">{submission.task.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Info */}
          <PixelCard title="STUDENT INFO">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Name</p>
                <p className="font-bold text-white">{submission.student.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">NIM</p>
                <p className="font-bold text-white">{submission.student.username}</p>
              </div>
            </div>
          </PixelCard>

          {/* Task Instructions */}
          <PixelCard title="TASK INSTRUCTIONS">
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: submission.task.instructions }} />
          </PixelCard>

          {/* Student Answer */}
          {submission.contentText && (
            <PixelCard title="STUDENT CODE">
              <pre className="bg-slate-950 border border-slate-700 p-4 overflow-x-auto text-sm text-emerald-400">
                <code>{submission.contentText}</code>
              </pre>
            </PixelCard>
          )}

          {submission.answersJson && (
            <PixelCard title="STUDENT ANSWERS">
              <div className="space-y-4">
                {submission.question && (
                  <div className="bg-slate-800 border border-slate-700 p-4">
                    <p className="font-bold text-white mb-2">{submission.question.prompt}</p>
                    <div className="bg-slate-900 border border-slate-700 p-3">
                      <p className="text-emerald-400">
                        {JSON.parse(submission.answersJson).answer}
                      </p>
                    </div>
                    {submission.question.answerKey && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <p className="text-xs text-slate-400 mb-1">Correct Answer:</p>
                        <p className="text-indigo-400">{submission.question.answerKey.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </PixelCard>
          )}

          {/* PDF Evidence */}
          {submission.evidencePdfPath && (
            <PixelCard title="SUBMITTED EVIDENCE (PDF)">
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-800 border border-slate-700 p-4">
                  <div className="flex items-center gap-3">
                    <FileText size={32} className="text-rose-400" />
                    <div>
                      <p className="font-bold text-white">Evidence Document</p>
                      <p className="text-xs text-slate-400">{submission.evidencePdfPath.split('/').pop()}</p>
                    </div>
                  </div>
                  <PixelButton 
                    href={getFileUrl('evidence', submission.evidencePdfPath)} 
                    variant="primary"
                    className="text-xs"
                  >
                    <Download size={14} className="mr-2" />
                    DOWNLOAD PDF
                  </PixelButton>
                </div>

                {/* PDF Viewer */}
                <div className="w-full h-[600px] bg-slate-900 border-2 border-slate-700 overflow-hidden">
                  <iframe 
                    src={getFileUrl('evidence', submission.evidencePdfPath)} 
                    className="w-full h-full"
                    title="Evidence PDF Viewer"
                  />
                </div>
              </div>
            </PixelCard>
          )}
        </div>

        {/* Sidebar - Grading Panel */}
        <div className="space-y-6">
          <GradingForm submission={submission} />

          <PixelCard title="SUBMISSION INFO">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className={`font-bold ${
                  submission.status === 'SUBMITTED' ? 'text-emerald-400' : 
                  submission.status === 'AUTOSUBMITTED' ? 'text-amber-400' : 
                  'text-slate-400'
                }`}>
                  {submission.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Submitted At</span>
                <span className="text-white">
                  {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              {submission.grade && (
                <div className="flex justify-between pt-3 border-t border-slate-700">
                  <span className="text-slate-400">Grade Status</span>
                  <span className={`font-bold ${
                    submission.grade.status === 'APPROVED' ? 'text-emerald-400' : 
                    submission.grade.status === 'RECOMMENDED' ? 'text-indigo-400' : 
                    'text-rose-400'
                  }`}>
                    {submission.grade.status}
                  </span>
                </div>
              )}
            </div>
          </PixelCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
