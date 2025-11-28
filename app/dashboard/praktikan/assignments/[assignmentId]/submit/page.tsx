import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Upload, FileText, AlertCircle, Download } from 'lucide-react';
import { getFileUrl } from '@/lib/supabase';

export default async function TPSubmitPage(props: { params: Promise<{ assignmentId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PRAKTIKAN') {
    redirect('/login');
  }

  const task = await prisma.task.findUnique({
    where: { id: params.assignmentId },
    include: {
      moduleWeek: {
        include: {
          course: true
        }
      },
      questions: {
        include: {
          answerKey: true
        },
        orderBy: {
          questionNo: 'asc'
        }
      },
      submissions: {
        where: { studentId: session.user.id }
      }
    }
  });

  if (!task) return <div>Task not found</div>;

  // Check if TP has been started by Publikasi
  const isTPStarted = await prisma.announcement.findFirst({
    where: {
      title: {
        contains: `TP Week ${task.moduleWeek.weekNo}`
      },
      courseId: task.moduleWeek.courseId,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Within last 7 days
      }
    }
  });

  const submission = task.submissions[0];
  const isSubmitted = submission && submission.status !== 'DRAFT';

  const navItems = [
    { href: '/dashboard/praktikan', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/praktikan/courses', label: 'Courses', icon: 'BookOpen' },
    { href: '/dashboard/praktikan/assignments', label: 'Assignments', icon: 'FileText' },
    { href: '/dashboard/praktikan/grades', label: 'Grades', icon: 'Award' },
  ];

  // If not started, show access denied
  if (!isTPStarted && task.type.toUpperCase() === 'TP') {
    return (
      <DashboardLayout user={session.user} navItems={navItems}>
        <div className="mb-8 flex items-center gap-4">
          <PixelButton href="/dashboard/praktikan/assignments" variant="outline" className="w-12 flex justify-center">
            <ArrowLeft size={20} />
          </PixelButton>
          <div>
            <h1 className="text-3xl font-pixel text-white mb-2">{task.title}</h1>
            <p className="text-slate-400">{task.moduleWeek.course.code} - Week {task.moduleWeek.weekNo}</p>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[60vh]">
          <PixelCard className="max-w-2xl w-full" color="bg-slate-900 border-amber-500">
            <div className="text-center py-12">
              <AlertCircle size={64} className="mx-auto text-amber-400 mb-6" />
              <h2 className="text-2xl font-pixel text-white mb-4">TUGAS PENDAHULUAN BELUM DIBUKA</h2>
              <p className="text-lg text-slate-300 mb-6">
                Tugas ini belum dimulai oleh Publikasi.
              </p>
              <p className="text-slate-400 mb-8">
                Silakan tunggu pengumuman dari Publikasi untuk dapat mengakses dan mengerjakan tugas ini.
              </p>
              <PixelButton href="/dashboard/praktikan" variant="primary">
                KEMBALI KE DASHBOARD
              </PixelButton>
            </div>
          </PixelCard>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8 flex items-center gap-4">
        <PixelButton href="/dashboard/praktikan/assignments" variant="outline" className="w-12 flex justify-center">
          <ArrowLeft size={20} />
        </PixelButton>
        <div>
          <h1 className="text-3xl font-pixel text-white mb-2">{task.title}</h1>
          <p className="text-slate-400">{task.moduleWeek.course.code} - Week {task.moduleWeek.weekNo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Instructions */}
          <PixelCard title="INSTRUCTIONS">
            <div className="prose prose-invert max-w-none mb-4" dangerouslySetInnerHTML={{ __html: task.instructions }} />
            
            {task.instructionPath && (
              <div className="mt-4 flex items-center gap-2">
                <FileText size={16} className="text-indigo-400" />
                <a 
                  href={getFileUrl('materials', task.instructionPath)}
                  className="text-indigo-400 hover:text-indigo-300 underline text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Instruction PDF
                </a>
              </div>
            )}

            {task.templatePath && (
              <div className="mt-2 flex items-center gap-2">
                <Download size={16} className="text-emerald-400" />
                <a 
                  href={getFileUrl('materials', task.templatePath)}
                  className="text-emerald-400 hover:text-emerald-300 underline text-sm"
                  download
                >
                  Download Template ZIP
                </a>
              </div>
            )}
          </PixelCard>

          {/* Questions */}
          {task.questions.length > 0 && (
            <PixelCard title="QUESTIONS">
              <form action="/api/submit-tp" method="POST" encType="multipart/form-data" className="space-y-6">
                <input type="hidden" name="taskId" value={task.id} />
                
                {task.questions.map((q, idx) => (
                  <div key={q.id} className="bg-slate-800 border border-slate-700 p-4">
                    <p className="font-bold text-white mb-4">{idx + 1}. {q.prompt}</p>
                    
                    {q.type === 'MCQ' && q.optionsJson && (
                      <div className="space-y-2">
                        {JSON.parse(q.optionsJson).map((opt: string, optIdx: number) => (
                          <label 
                            key={optIdx}
                            className="flex items-center gap-3 p-3 border border-slate-600 hover:bg-slate-700 cursor-pointer transition-colors"
                          >
                            <input 
                              type="radio" 
                              name={`question_${q.id}`}
                              value={optIdx}
                              required
                              className="w-4 h-4"
                              disabled={isSubmitted}
                            />
                            <span className="text-slate-300">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'CODE' && (
                      <textarea 
                        name={`question_${q.id}`}
                        className="w-full h-64 bg-slate-950 border border-slate-700 p-4 font-mono text-sm text-emerald-400"
                        placeholder="// Write your code here..."
                        required
                        disabled={isSubmitted}
                      />
                    )}
                  </div>
                ))}

                {/* File Upload */}
                <div className="bg-slate-800 border border-slate-700 p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Upload size={20} className="text-indigo-400" />
                    UPLOAD EVIDENCE
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Upload your code screenshot or result as PDF (max 10MB)
                  </p>
                  <input 
                    type="file" 
                    name="evidence" 
                    accept=".pdf"
                    className="w-full bg-black border border-slate-600 p-3 text-white"
                    required
                    disabled={isSubmitted}
                  />
                </div>

                {!isSubmitted ? (
                  <PixelButton type="submit" variant="success" className="w-full py-4 text-lg">
                    <Upload size={24} className="mr-2" />
                    SUBMIT TUGAS PENDAHULUAN
                  </PixelButton>
                ) : (
                  <div className="bg-emerald-900/50 border-2 border-emerald-500 p-6 text-center">
                    <p className="text-emerald-400 font-bold text-lg">TUGAS TELAH DISUBMIT ✓</p>
                    <p className="text-slate-300 text-sm mt-2">
                      Submitted on {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                )}
              </form>
            </PixelCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PixelCard title="TASK INFO">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Type</span>
                <span className="font-bold text-white">{task.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className={`font-bold ${isSubmitted ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isSubmitted ? 'SUBMITTED' : 'PENDING'}
                </span>
              </div>
              {submission?.grade && (
                <div className="flex justify-between border-t border-slate-700 pt-3">
                  <span className="text-slate-400">Score</span>
                  <span className="font-bold text-emerald-400 text-lg">{submission.grade.score}</span>
                </div>
              )}
            </div>
          </PixelCard>

          {submission?.evidencePdfPath && (
            <PixelCard title="YOUR SUBMISSION">
              <div className="text-center py-4">
                <FileText size={48} className="mx-auto text-emerald-400 mb-4" />
                <p className="text-sm text-slate-300 mb-4">Evidence uploaded</p>
                <PixelButton 
                  href={getFileUrl('evidence', submission.evidencePdfPath)}
                  variant="outline"
                  className="w-full text-xs"
                >
                  <Download size={14} className="mr-2" />
                  VIEW EVIDENCE
                </PixelButton>
              </div>
            </PixelCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

