import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard } from '@/components/ui';
import prisma from '@/lib/prisma';

const navItems = [
  { href: '/dashboard/praktikan', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/praktikan/courses', label: 'Courses', icon: 'BookOpen' },
  { href: '/dashboard/praktikan/assignments', label: 'Assignments', icon: 'FileText' },
  { href: '/dashboard/praktikan/grades', label: 'Grades', icon: 'Award' },
];

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PRAKTIKAN') {
    redirect('/login');
  }

  // Fetch user's assignments
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      enrollments: {
        include: {
          shift: {
            include: {
              course: {
                include: {
                  modules: {
                    include: {
                      tasks: {
                        include: {
                          submissions: {
                            where: { studentId: session.user.id },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Flatten all tasks with their submission status
  const assignments = user?.enrollments.flatMap((enrollment) => {
    return enrollment.shift.course.modules.flatMap((module) =>
      module.tasks.map((task) => {
        const submission = task.submissions[0];
        const isPending = !submission || submission.status === 'DRAFT';
        const isLate = task.dueDate && new Date() > task.dueDate && isPending;

        return {
          id: task.id,
          title: task.title,
          type: task.type,
          weekNo: module.weekNo,
          courseName: enrollment.shift.course.title,
          courseCode: enrollment.shift.course.code,
          dueDate: task.dueDate,
          status: submission?.status || 'NOT_SUBMITTED',
          score: submission?.autoScore ?? null,
          isLate,
          isPending,
        };
      })
    );
  }) || [];

  const pendingAssignments = assignments.filter((a) => a.isPending);
  const completedAssignments = assignments.filter((a) => !a.isPending);

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">MY ASSIGNMENTS</h1>
        <p className="text-slate-400">Track your tasks and submissions</p>
      </div>

      {/* Pending Assignments */}
      <div className="mb-8">
        <h2 className="text-xl font-pixel text-white mb-4">
          PENDING ({pendingAssignments.length})
        </h2>
        {pendingAssignments.length === 0 ? (
          <PixelCard title="NO PENDING ASSIGNMENTS">
            <div className="text-center py-8">
              <p className="text-slate-400">You're all caught up! 🎉</p>
            </div>
          </PixelCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingAssignments.map((assignment) => (
              <PixelCard key={assignment.id} title={assignment.type}>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{assignment.title}</h3>
                    <p className="text-xs text-slate-400">
                      {assignment.courseCode} - Week {assignment.weekNo}
                    </p>
                  </div>

                  {assignment.dueDate && (
                    <div className="text-xs">
                      <span className="text-slate-500">Due: </span>
                      <span
                        className={assignment.isLate ? 'text-red-400 font-bold' : 'text-slate-300'}
                      >
                        {new Date(assignment.dueDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {assignment.isLate && (
                    <div className="bg-red-500/20 border-2 border-red-500 p-2">
                      <p className="text-xs text-red-400 font-bold">⚠️ OVERDUE</p>
                    </div>
                  )}

                  <Link
                    href={`/dashboard/praktikan/assignments/${assignment.id}`}
                    className="pixel-btn bg-yellow-500 hover:bg-yellow-600 text-black w-full text-center block"
                  >
                    SUBMIT NOW
                  </Link>
                </div>
              </PixelCard>
            ))}
          </div>
        )}
      </div>

      {/* Completed Assignments */}
      <div>
        <h2 className="text-xl font-pixel text-white mb-4">
          COMPLETED ({completedAssignments.length})
        </h2>
        {completedAssignments.length === 0 ? (
          <PixelCard title="NO COMPLETED ASSIGNMENTS">
            <div className="text-center py-8">
              <p className="text-slate-400">No completed assignments yet</p>
            </div>
          </PixelCard>
        ) : (
          <div className="space-y-4">
            {completedAssignments.map((assignment) => (
              <PixelCard key={assignment.id} title={assignment.type}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white mb-1">{assignment.title}</h3>
                    <p className="text-xs text-slate-400">
                      {assignment.courseCode} - Week {assignment.weekNo}
                    </p>
                  </div>

                  <div className="text-center px-6">
                    <span
                      className={`text-xs font-bold px-2 py-1 ${
                        assignment.status === 'GRADED'
                          ? 'bg-green-500 text-black'
                          : assignment.status === 'SUBMITTED'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-600 text-white'
                      }`}
                    >
                      {assignment.status}
                    </span>
                    {assignment.score !== null && (
                      <p className="text-lg font-bold text-green-400 mt-2">{assignment.score}</p>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/praktikan/assignments/${assignment.id}`}
                    className="pixel-btn bg-slate-600 hover:bg-slate-700 text-white"
                  >
                    VIEW
                  </Link>
                </div>
              </PixelCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
