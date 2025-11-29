import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
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

export default async function GradesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PRAKTIKAN') {
    redirect('/login');
  }

  // Fetch user's graded submissions
  const submissions = await prisma.submission.findMany({
    where: {
      studentId: session.user.id,
      status: 'GRADED',
    },
    include: {
      task: {
        include: {
          moduleWeek: {
            include: {
              course: true,
            },
          },
        },
      },
      grade: true,
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  // Group by course
  const submissionsByCourse = submissions.reduce((acc, submission) => {
    const courseId = submission.task.moduleWeek.course.id;
    if (!acc[courseId]) {
      acc[courseId] = {
        course: submission.task.moduleWeek.course,
        submissions: [],
      };
    }
    acc[courseId].submissions.push(submission);
    return acc;
  }, {} as Record<string, { course: any; submissions: typeof submissions }>);

  const courseGrades = Object.values(submissionsByCourse);

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">MY GRADES</h1>
        <p className="text-slate-400">Track your academic performance</p>
      </div>

      {courseGrades.length === 0 ? (
        <PixelCard title="NO GRADES YET">
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No graded submissions yet</p>
            <p className="text-xs text-slate-600">
              Grades will appear here once your submissions are graded
            </p>
          </div>
        </PixelCard>
      ) : (
        <div className="space-y-8">
          {courseGrades.map(({ course, submissions: courseSubmissions }) => {
            // Group by module
            const moduleScores = courseSubmissions.reduce((acc, sub) => {
              const moduleId = sub.task.moduleWeek.id;
              if (!acc[moduleId]) {
                acc[moduleId] = {
                  weekNo: sub.task.moduleWeek.weekNo,
                  submissions: [],
                };
              }
              acc[moduleId].submissions.push(sub);
              return acc;
            }, {} as Record<string, { weekNo: number; submissions: typeof courseSubmissions }>);

            const avgScore =
              courseSubmissions.reduce((sum, s) => sum + (s.grade?.score || 0), 0) /
              courseSubmissions.length;

            return (
              <div key={course.id}>
                <h2 className="text-xl font-pixel text-white mb-4">
                  {course.code} - {course.title}
                </h2>

                {/* Summary Card */}
                <PixelCard title="GRADE SUMMARY" className="mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-2">TOTAL GRADED</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {courseSubmissions.length}
                      </p>
                      <p className="text-xs text-slate-500">Submissions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-2">AVG SCORE</p>
                      <p className="text-2xl font-bold text-green-400">
                        {avgScore.toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-500">out of 100</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-2">MODULES</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {Object.keys(moduleScores).length}
                      </p>
                      <p className="text-xs text-slate-500">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-2">STATUS</p>
                      <span className="text-xs font-bold px-3 py-1 bg-green-500 text-black">
                        {course.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                </PixelCard>

                {/* Detailed Grades */}
                <PixelCard title="SUBMISSION GRADES">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-700">
                          <th className="text-left py-3 px-2 text-slate-400 font-bold">WEEK</th>
                          <th className="text-left py-3 px-2 text-slate-400 font-bold">TASK</th>
                          <th className="text-center py-3 px-2 text-slate-400 font-bold">TYPE</th>
                          <th className="text-center py-3 px-2 text-slate-400 font-bold">SCORE</th>
                          <th className="text-center py-3 px-2 text-slate-400 font-bold">MAX</th>
                          <th className="text-center py-3 px-2 text-slate-400 font-bold">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseSubmissions.map((submission) => (
                          <tr
                            key={submission.id}
                            className="border-b border-slate-800 hover:bg-slate-800/50"
                          >
                            <td className="py-3 px-2 text-white font-bold">
                              Week {submission.task.moduleWeek.weekNo}
                            </td>
                            <td className="py-3 px-2 text-white">
                              {submission.task.title}
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className="text-xs font-bold px-2 py-1 bg-blue-500 text-white">
                                {submission.task.type}
                              </span>
                            </td>
                            <td className="text-center py-3 px-2 text-green-400 font-bold text-lg">
                              {submission.grade?.score?.toFixed(1) || '-'}
                            </td>
                            <td className="text-center py-3 px-2 text-slate-400">
                              {submission.grade?.maxScore || 100}
                            </td>
                            <td className="text-center py-3 px-2">
                              <span
                                className={`text-xs font-bold px-2 py-1 ${
                                  submission.grade?.status === 'APPROVED'
                                    ? 'bg-green-500 text-black'
                                    : submission.grade?.status === 'RECOMMENDED'
                                    ? 'bg-yellow-500 text-black'
                                    : 'bg-slate-600 text-white'
                                }`}
                              >
                                {submission.grade?.status || 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </PixelCard>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
