import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { Upload, Clock, FileText, CheckCircle } from 'lucide-react';

export default async function AssignmentDetailPage(props: { params: Promise<{ assignmentId: string }> }) {
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
      submissions: {
        where: { studentId: session.user.id }
      }
    }
  });

  if (!task) return <div>Assignment not found</div>;

  const submission = task.submissions[0];
  const isSubmitted = submission && submission.status !== 'DRAFT';
  const isLiveTask = ['JURNAL', 'PRETEST', 'POSTTEST'].includes(task.type);

  const navItems = [
    { href: '/dashboard/praktikan', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/praktikan/courses', label: 'Courses', icon: 'BookOpen' },
    { href: '/dashboard/praktikan/assignments', label: 'Assignments', icon: 'FileText' },
    { href: '/dashboard/praktikan/grades', label: 'Grades', icon: 'Award' },
  ];

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8">
        <div className="flex items-center gap-4">
             <PixelButton href="/dashboard/praktikan/assignments" variant="outline" className="w-12 flex justify-center">
                 ←
             </PixelButton>
             <div>
                <h1 className="text-3xl font-pixel text-white mb-2">{task.title}</h1>
                <p className="text-slate-400">{task.moduleWeek.course.code} - Week {task.moduleWeek.weekNo}</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
              <PixelCard title="INSTRUCTIONS">
                  <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: task.instructions }} />
              </PixelCard>

              {isLiveTask && (
                  <div className="bg-slate-900 p-8 text-center border-2 border-slate-700">
                      <Clock size={48} className="mx-auto text-amber-400 mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">LIVE SESSION REQUIRED</h3>
                      <p className="text-slate-400 mb-6">This assignment can only be completed during a live practical session.</p>
                      <PixelButton href="/dashboard/praktikan" variant="primary">
                          GO TO DASHBOARD
                      </PixelButton>
                  </div>
              )}
              
              {!isLiveTask && task.type.toUpperCase() === 'TP' && (
                  <PixelCard title="SUBMISSION">
                      {isSubmitted ? (
                          <div className="text-center py-8">
                              <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4" />
                              <h3 className="text-xl font-bold text-white mb-2">SUBMITTED</h3>
                              <p className="text-slate-400">Submitted on {submission.submittedAt?.toLocaleDateString()}</p>
                              <div className="mt-6">
                                  <PixelButton 
                                      href={`/dashboard/praktikan/assignments/${task.id}/submit`}
                                      variant="outline"
                                  >
                                      VIEW SUBMISSION
                                  </PixelButton>
                              </div>
                          </div>
                      ) : (
                          <div className="text-center py-8">
                              <FileText size={48} className="mx-auto text-indigo-400 mb-4" />
                              <p className="text-slate-400 mb-4">Kerjakan Tugas Pendahuluan Anda</p>
                              <div className="max-w-xs mx-auto">
                                  <PixelButton 
                                      href={`/dashboard/praktikan/assignments/${task.id}/submit`}
                                      variant="primary" 
                                      className="w-full"
                                  >
                                      <Upload size={16} className="mr-2" />
                                      KERJAKAN TUGAS
                                  </PixelButton>
                              </div>
                          </div>
                      )}
                  </PixelCard>
              )}
          </div>

          <div className="space-y-6">
              <PixelCard title="DETAILS">
                  <div className="space-y-4 text-sm">
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
                          <div className="flex justify-between border-t border-slate-700 pt-4">
                              <span className="text-slate-400">Score</span>
                              <span className="font-bold text-emerald-400 text-lg">{submission.grade.score}</span>
                          </div>
                      )}
                  </div>
              </PixelCard>
          </div>
      </div>
    </DashboardLayout>
  );
}

