import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, StatusBar } from '@/components/ui';
import { ShieldAlert, Clock, Award } from 'lucide-react';
import { prisma } from '@/lib/prisma';

const navItems = [
  { href: '/dashboard/praktikan', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/praktikan/courses', label: 'Courses', icon: 'BookOpen' },
  { href: '/dashboard/praktikan/assignments', label: 'Assignments', icon: 'FileText' },
  { href: '/dashboard/praktikan/grades', label: 'Grades', icon: 'Award' },
];

export default async function PraktikanDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PRAKTIKAN') {
    redirect('/login');
  }

  // Fetch Real Data
  // 1. Grades
  const grades = await prisma.grade.findMany({
      where: {
          submission: { studentId: session.user.id },
          status: 'APPROVED'
      }
  });
  const totalXp = grades.reduce((acc, g) => acc + (g.score * 10), 0); // Scale score to XP
  const avgGrade = grades.length > 0 
      ? grades.reduce((acc, g) => acc + g.score, 0) / grades.length 
      : 0;

  // 2. Attendance
  const attendances = await prisma.attendance.findMany({
      where: { studentId: session.user.id }
  });
  const presentCount = attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
  const attendanceRate = attendances.length > 0 
      ? Math.round((presentCount / attendances.length) * 100) 
      : 100; // Default 100 if no sessions yet

  // 3. Violations (HP)
  const violations = await prisma.violation.findMany({
      where: { studentId: session.user.id }
  });
  const totalPenalty = violations.reduce((acc, v) => acc + v.points, 0);
  const currentHp = Math.max(0, 100 - totalPenalty);

  // 4. Upcoming Classes
  const assignments = await prisma.studentAssignment.findMany({
      where: { studentId: session.user.id },
      include: { shift: { include: { course: true } } }
  });

  const upcomingClasses = assignments.map(a => ({
      id: a.shift.id,
      course: a.shift.course.code,
      shift: a.shift.name,
      day: a.shift.day,
      time: `${a.shift.startTime} - ${a.shift.endTime}`,
      room: a.shift.room,
      status: 'upcoming'
  }));

  // 5. Announcements
  const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 3
  });

  // 6. Active Live Session
  const shiftIds = assignments.map(a => a.shiftId);
  const activeLiveSession = await prisma.liveSession.findFirst({
      where: {
          shiftId: { in: shiftIds },
          status: 'ACTIVE'
      },
      include: {
          shift: { include: { course: true } },
          moduleWeek: true
      }
  });

  // 7. Modules (Quest Board)
  // Fetch modules for enrolled courses
  const courseIds = assignments.map(a => a.shift.courseId);
  const modules = await prisma.moduleWeek.findMany({
      where: { courseId: { in: courseIds }, isActive: true },
      orderBy: { weekNo: 'asc' },
      take: 5
  });

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">PRAKTIKAN DASHBOARD</h1>
        <p className="text-slate-400">Welcome back, {session.user.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <PixelCard color="bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase">HP (Disiplin)</p>
              <p className="text-2xl font-bold text-emerald-400">{currentHp}/100</p>
            </div>
            <ShieldAlert className="text-emerald-400" size={32} />
          </div>
        </PixelCard>

        <PixelCard color="bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase">XP (Nilai)</p>
              <p className="text-2xl font-bold text-indigo-400">{Math.round(totalXp)}</p>
            </div>
            <Award className="text-indigo-400" size={32} />
          </div>
        </PixelCard>

        <PixelCard color="bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase">Kehadiran</p>
              <p className="text-2xl font-bold text-amber-400">{attendanceRate}%</p>
            </div>
            <Clock className="text-amber-400" size={32} />
          </div>
        </PixelCard>

        <PixelCard color="bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase">Rata-rata</p>
              <p className="text-2xl font-bold text-rose-400">{avgGrade.toFixed(1)}</p>
            </div>
            <Award className="text-rose-400" size={32} />
          </div>
        </PixelCard>
      </div>

      {/* Active Live Session Banner */}
      {activeLiveSession && (
        <div className="mb-8 animate-pulse">
          <PixelCard color="bg-gradient-to-r from-emerald-900 to-cyan-900 border-emerald-500">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="text-xl font-pixel text-white mb-1">LIVE SESSION ACTIVE</h3>
                  <p className="text-emerald-300">
                    {activeLiveSession.shift.course.code} - {activeLiveSession.moduleWeek.title}
                  </p>
                  <p className="text-xs text-emerald-400">Shift: {activeLiveSession.shift.name}</p>
                </div>
              </div>
              <a 
                href={`/live/${activeLiveSession.id}`}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all"
              >
                JOIN NOW →
              </a>
            </div>
          </PixelCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Stats */}
        <div className="lg:col-span-1">
          <PixelCard title="PLAYER STATS" className="mb-6">
            <div className="space-y-4 mt-2">
              <StatusBar
                label="HP (Disiplin)"
                current={currentHp}
                max={100}
                color="bg-rose-500"
                icon={ShieldAlert}
              />
              <StatusBar
                label="XP (Nilai)"
                current={Math.round(totalXp)}
                max={Math.max(2000, Math.round(totalXp) + 500)}
                color="bg-indigo-500"
                icon={Award}
              />
              <div className="mt-4 text-xs text-slate-400 border-t border-slate-700 pt-4">
                <p>LEVEL {Math.floor(totalXp / 500) + 1} APPRENTICE</p>
                {violations.length > 0 && (
                    <div className="mt-2">
                        <p className="text-rose-400 font-bold">Recent Violations:</p>
                        {violations.slice(0, 2).map(v => (
                            <p key={v.id} className="text-rose-300">- {v.description} (-{v.points})</p>
                        ))}
                    </div>
                )}
              </div>
            </div>
          </PixelCard>

          <PixelCard title="LIVE SESSION" color="bg-indigo-900/50">
            <div className="text-center py-8">
              <Clock size={48} className="mx-auto mb-4 text-slate-500" />
              <p className="text-slate-400 text-sm mb-2">NO ACTIVE SESSION</p>
              <p className="text-xs text-slate-600">Check back during your scheduled shift.</p>
            </div>
          </PixelCard>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements */}
          <PixelCard title="📢 ANNOUNCEMENTS">
            <div className="space-y-3 mt-2">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-slate-900 border-l-4 border-amber-400 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{announcement.title}</h3>
                      <p className="text-xs text-slate-400">{new Date(announcement.createdAt).toLocaleDateString()}</p>
                    </div>
                    {announcement.isPinned && (
                      <span className="bg-amber-400 text-black text-xs px-2 py-1 font-bold">
                        PINNED
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-slate-500 italic">No announcements.</p>}
            </div>
          </PixelCard>

          {/* Upcoming Classes */}
          <PixelCard title="📅 JADWAL PRAKTIKUM">
            <div className="space-y-3 mt-2">
              {upcomingClasses.map((class_) => (
                <div
                  key={class_.id}
                  className="bg-slate-900 border-2 border-slate-700 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-500 w-12 h-12 flex items-center justify-center font-pixel text-xs text-black">
                      {class_.day.substring(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{class_.course}</h3>
                      <p className="text-sm text-slate-400">{class_.shift}</p>
                      <p className="text-xs text-emerald-400 mt-1">
                        {class_.time} • {class_.room}
                      </p>
                    </div>
                  </div>
                  <span className="bg-amber-400 text-black text-xs px-3 py-1 font-bold uppercase">
                    Upcoming
                  </span>
                </div>
              ))}
              {upcomingClasses.length === 0 && <p className="text-slate-500 italic">No enrolled courses.</p>}
            </div>
          </PixelCard>

          {/* Quest Board */}
          <PixelCard title="🎯 QUEST BOARD (MODUL)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {modules.map((mod) => {
                  const isLocked = new Date() < new Date(mod.releaseAt);
                  return (
                    <div
                      key={mod.id}
                      className={`bg-slate-900 border-b-4 p-4 ${
                        !isLocked
                          ? 'border-amber-400'
                          : 'border-slate-700 opacity-50'
                      }`}
                    >
                      <div className="flex justify-between mb-2">
                        <span
                          className={`text-xs px-2 py-1 font-bold uppercase ${
                            !isLocked
                              ? 'bg-emerald-500 text-black'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          {isLocked ? 'LOCKED' : 'ACTIVE'}
                        </span>
                        <Award size={16} className="text-amber-400" />
                      </div>
                      <h3 className="font-bold text-sm mb-2">{mod.title}</h3>
                      <p className="text-xs text-slate-400">Week {mod.weekNo}</p>
                    </div>
                  );
              })}
            </div>
          </PixelCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
