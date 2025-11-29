import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Award, TrendingUp, Calendar, Target } from 'lucide-react';

export default async function StudentDetailPage(props: { params: Promise<{ studentId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ASISTEN') {
    redirect('/login');
  }

  // Check access
  const hasAccess = await prisma.studentAssignment.findFirst({
    where: {
      studentId: params.studentId,
      plotting: {
        assistantId: session.user.id
      }
    },
    include: {
      student: true,
      shift: {
        include: {
          course: true
        }
      }
    }
  });

  if (!hasAccess) {
    return <div>Access denied</div>;
  }

  const student = hasAccess.student;

  // Fetch student's submissions and grades
  const submissions = await prisma.submission.findMany({
    where: {
      studentId: params.studentId,
      grade: { isNot: null }
    },
    include: {
      grade: true,
      task: {
        include: {
          moduleWeek: {
            include: {
              course: true
            }
          }
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  });

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const averageScore = totalSubmissions > 0
    ? Math.round(submissions.reduce((sum, s) => sum + (s.grade?.score || 0), 0) / totalSubmissions)
    : 0;

  const taskTypeBreakdown = submissions.reduce((acc, s) => {
    const type = s.task.type;
    if (!acc[type]) {
      acc[type] = { count: 0, totalScore: 0 };
    }
    acc[type].count++;
    acc[type].totalScore += s.grade?.score || 0;
    return acc;
  }, {} as Record<string, { count: number; totalScore: number }>);

  // Attendance
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      studentId: params.studentId
    },
    include: {
      liveSession: {
        include: {
          moduleWeek: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const attendanceRate = attendanceRecords.length > 0
    ? Math.round((attendanceRecords.filter(a => a.status === 'PRESENT').length / attendanceRecords.length) * 100)
    : 0;

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
        <PixelButton href="/dashboard/asisten/students" variant="outline" className="w-12 flex justify-center">
          <ArrowLeft size={20} />
        </PixelButton>
        <div>
          <h1 className="text-3xl font-pixel text-white mb-2">{student.name}</h1>
          <p className="text-slate-400">{student.username} • {hasAccess.shift.course.code}</p>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <PixelCard title="AVG SCORE">
          <div className="text-center py-4">
            <div className="text-5xl font-pixel text-emerald-400 mb-2">{averageScore}</div>
            <p className="text-slate-400 text-xs">Out of 100</p>
          </div>
        </PixelCard>

        <PixelCard title="SUBMISSIONS">
          <div className="text-center py-4">
            <div className="text-5xl font-pixel text-indigo-400 mb-2">{totalSubmissions}</div>
            <p className="text-slate-400 text-xs">Total completed</p>
          </div>
        </PixelCard>

        <PixelCard title="ATTENDANCE">
          <div className="text-center py-4">
            <div className="text-5xl font-pixel text-cyan-400 mb-2">{attendanceRate}%</div>
            <p className="text-slate-400 text-xs">{attendanceRecords.filter(a => a.status === 'PRESENT').length} / {attendanceRecords.length} sessions</p>
          </div>
        </PixelCard>

        <PixelCard title="HP/XP">
          <div className="text-center py-4">
            <div className="text-3xl font-pixel text-rose-400 mb-1">{student.hp || 100} HP</div>
            <div className="text-3xl font-pixel text-amber-400">{student.xp || 0} XP</div>
          </div>
        </PixelCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Grades by Task Type */}
        <div className="lg:col-span-2 space-y-6">
          <PixelCard title="PERFORMANCE BY TASK TYPE">
            <div className="space-y-4">
              {Object.entries(taskTypeBreakdown).map(([type, data]) => {
                const avg = Math.round(data.totalScore / data.count);
                return (
                  <div key={type} className="bg-slate-800 border border-slate-700 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white uppercase">{type}</span>
                      <span className="text-slate-400 text-sm">{data.count} submissions</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-slate-900 h-6 border border-slate-700 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 flex items-center justify-center text-xs font-bold"
                          style={{ width: `${avg}%` }}
                        >
                          {avg > 20 && <span className="text-white">{avg}%</span>}
                        </div>
                      </div>
                      <span className="text-2xl font-pixel text-emerald-400 w-16 text-right">{avg}</span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(taskTypeBreakdown).length === 0 && (
                <p className="text-center text-slate-500 py-8">No graded submissions yet</p>
              )}
            </div>
          </PixelCard>

          <PixelCard title="RECENT SUBMISSIONS">
            <div className="space-y-3">
              {submissions.slice(0, 10).map((sub) => (
                <div key={sub.id} className="bg-slate-800 border border-slate-700 p-3 flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{sub.task.title}</p>
                    <p className="text-xs text-slate-400">
                      {sub.task.moduleWeek.course.code} - Week {sub.task.moduleWeek.weekNo} • {sub.task.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-pixel text-emerald-400">{sub.grade?.score || 0}</p>
                    <p className="text-xs text-slate-500">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <p className="text-center text-slate-500 py-8">No submissions yet</p>
              )}
            </div>
          </PixelCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PixelCard title="STUDENT INFO">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Name</p>
                <p className="font-bold text-white">{student.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Username</p>
                <p className="font-bold text-white">{student.username}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="font-bold text-white">{student.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Shift</p>
                <p className="font-bold text-white">{hasAccess.shift.name}</p>
              </div>
            </div>
          </PixelCard>

          <PixelCard title="ATTENDANCE HISTORY">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {attendanceRecords.map((record) => (
                <div key={record.id} className="bg-slate-800 border border-slate-700 p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">
                      Week {record.liveSession.moduleWeek.weekNo}
                    </span>
                    <span className={`text-xs font-bold ${
                      record.status === 'PRESENT' ? 'text-emerald-400' : 
                      record.status === 'LATE' ? 'text-amber-400' : 
                      'text-rose-400'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(record.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {attendanceRecords.length === 0 && (
                <p className="text-center text-slate-500 py-4 text-xs">No records</p>
              )}
            </div>
          </PixelCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

