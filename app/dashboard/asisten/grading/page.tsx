import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import prisma from '@/lib/prisma';

const navItems = [
  { href: '/dashboard/asisten', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/asisten/students', label: 'Students', icon: 'Users' },
  { href: '/dashboard/asisten/grading', label: 'Grading', icon: 'FileText' },
  { href: '/dashboard/asisten/feedback', label: 'Feedback', icon: 'MessageSquare' },
];

export default async function GradingPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ASISTEN') {
    redirect('/login');
  }

  // Fetch submissions from asisten's students that need grading
  const plottings = await prisma.plotting.findMany({
    where: {
      assistantId: session.user.id,
    },
    include: {
      studentAssignments: {
        select: {
          studentId: true,
        },
      },
    },
  });

  const studentIds = plottings.flatMap((p) =>
    p.studentAssignments.map((sa) => sa.studentId)
  );

  const allSubmissions = await prisma.submission.findMany({
    where: {
      studentId: { in: studentIds },
      status: { in: ['SUBMITTED', 'AUTOSUBMITTED', 'GRADED'] }
    },
    include: {
      student: true,
      grade: true,
      task: {
        include: {
          moduleWeek: {
            include: {
              course: true,
            },
          },
        },
      },
    },
    orderBy: [
      { submittedAt: 'desc' },
    ],
  });

  // Deduplicate submissions: keep most complete submission per student per task
  const submissionMap = new Map();

  for (const sub of allSubmissions) {
    const key = `${sub.taskId}_${sub.studentId}`;
    const existing = submissionMap.get(key);

    // Scoring: prefer submissions with more content
    const score = (sub: typeof allSubmissions[0]) => {
      let s = 0;
      if (sub.contentText) s += 10;
      if (sub.answersJson) s += 10;
      if (sub.evidencePdfPath) s += 5;
      if (sub.questionId) s += 1;
      return s;
    };

    if (!existing || score(sub) > score(existing)) {
      submissionMap.set(key, sub);
    }
  }

  const submissions = Array.from(submissionMap.values()).sort((a, b) =>
    (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0)
  );

  const pendingSubmissions = submissions.filter(
    (s) => !s.grade || ['PENDING', 'RECOMMENDED'].includes(s.grade.status)
  );

  const gradedSubmissions = submissions.filter(
    (s) => s.grade && (s.grade.status === 'APPROVED' || s.grade.status === 'REJECTED')
  );

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">GRADING QUEUE</h1>
        <p className="text-slate-400">Review and grade student submissions</p>
      </div>

      {/* Pending Grading */}
      <div className="mb-8">
        <h2 className="text-xl font-pixel text-white mb-4">
          PENDING REVIEW ({pendingSubmissions.length})
        </h2>
        {pendingSubmissions.length === 0 ? (
          <PixelCard title="NO PENDING SUBMISSIONS">
            <div className="text-center py-8">
              <p className="text-slate-400">All caught up! No submissions to grade 🎉</p>
            </div>
          </PixelCard>
        ) : (
          <div className="space-y-4">
            {pendingSubmissions.map((submission) => (
              <PixelCard key={submission.id} title={submission.task.type}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white mb-1">
                      {submission.task.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-1">
                      {submission.task.moduleWeek.course.code} - Week{' '}
                      {submission.task.moduleWeek.weekNo}
                    </p>
                    <p className="text-xs text-slate-500">
                      Student: {submission.student.name} ({submission.student.username})
                    </p>
                  </div>

                  <div className="text-center px-6">
                    <p className="text-xs text-slate-400 mb-1">Rec. Score</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {submission.grade?.score ?? '-'}
                    </p>
                  </div>

                  <div className="text-center px-6">
                    <p className="text-xs text-slate-400 mb-1">Submitted</p>
                    <p className="text-xs text-slate-300">
                      {submission.submittedAt
                        ? new Date(submission.submittedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </p>
                  </div>

                  <PixelButton href={`/dashboard/asisten/grading/${submission.id}`} variant="warning">
                    GRADE
                  </PixelButton>
                </div>
              </PixelCard>
            ))}
          </div>
        )}
      </div>

      {/* Graded Submissions */}
      <div>
        <h2 className="text-xl font-pixel text-white mb-4">
          RECENTLY GRADED ({gradedSubmissions.length})
        </h2>
        {gradedSubmissions.length === 0 ? (
          <PixelCard title="NO GRADED SUBMISSIONS">
            <div className="text-center py-8">
              <p className="text-slate-400">No graded submissions yet</p>
            </div>
          </PixelCard>
        ) : (
          <div className="space-y-4">
            {gradedSubmissions.slice(0, 10).map((submission) => (
              <PixelCard key={submission.id} title={submission.task.type} color="bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white mb-1">
                      {submission.task.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-1">
                      Student: {submission.student.name}
                    </p>
                  </div>

                  <div className="text-center px-6">
                    <p className="text-xs text-slate-400 mb-1">Final Score</p>
                    <p className="text-2xl font-bold text-green-400">
                      {submission.grade?.score ?? '-'}
                    </p>
                  </div>

                  <PixelButton href={`/dashboard/asisten/grading/${submission.id}`} variant="neutral">
                    VIEW
                  </PixelButton>
                </div>
              </PixelCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
