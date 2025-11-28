import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, StatusBar } from '@/components/ui';
import { ShieldAlert, Clock, Award } from 'lucide-react';

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

  // Mock data (in production, fetch from database)
  const stats = {
    hp: 90, // Discipline points
    xp: 1250, // Total score
    attendanceRate: 95,
    averageGrade: 85,
  };

  const upcomingClasses = [
    {
      id: 1,
      course: 'WAD2025-SI4801',
      shift: 'Shift 1 - Senin Pagi',
      day: 'Senin',
      time: '08:00 - 11:00',
      room: 'Lab A203',
      status: 'upcoming',
    },
  ];

  const recentAnnouncements = [
    {
      id: 1,
      title: '🎉 Selamat Datang di WAD 2025!',
      date: '2025-01-06',
      isPinned: true,
    },
  ];

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
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
              <p className="text-2xl font-bold text-emerald-400">{stats.hp}/100</p>
            </div>
            <ShieldAlert className="text-emerald-400" size={32} />
          </div>
        </PixelCard>

        <PixelCard color="bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase">XP (Nilai)</p>
              <p className="text-2xl font-bold text-indigo-400">{stats.xp}/2000</p>
            </div>
            <Award className="text-indigo-400" size={32} />
          </div>
        </PixelCard>

        <PixelCard color="bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase">Kehadiran</p>
              <p className="text-2xl font-bold text-amber-400">{stats.attendanceRate}%</p>
            </div>
            <Clock className="text-amber-400" size={32} />
          </div>
        </PixelCard>

        <PixelCard color="bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase">Rata-rata</p>
              <p className="text-2xl font-bold text-rose-400">{stats.averageGrade}</p>
            </div>
            <Award className="text-rose-400" size={32} />
          </div>
        </PixelCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Stats */}
        <div className="lg:col-span-1">
          <PixelCard title="PLAYER STATS" className="mb-6">
            <div className="space-y-4 mt-2">
              <StatusBar
                label="HP (Disiplin)"
                current={stats.hp}
                max={100}
                color="bg-rose-500"
                icon={ShieldAlert}
              />
              <StatusBar
                label="XP (Nilai)"
                current={stats.xp}
                max={2000}
                color="bg-indigo-500"
                icon={Award}
              />
              <div className="mt-4 text-xs text-slate-400 border-t border-slate-700 pt-4">
                <p>LEVEL 5 APPRENTICE</p>
                <p className="text-rose-400 mt-1">Penalty: -10% (Late Join Week 1)</p>
              </div>
            </div>
          </PixelCard>

          <PixelCard title="LIVE SESSION" color="bg-indigo-900/50">
            <div className="text-center py-8">
              <Clock size={48} className="mx-auto mb-4 text-slate-500" />
              <p className="text-slate-400 text-sm mb-2">NO ACTIVE SESSION</p>
              <p className="text-xs text-slate-600">Menunggu publikasi memulai sesi...</p>
            </div>
          </PixelCard>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements */}
          <PixelCard title="📢 ANNOUNCEMENTS">
            <div className="space-y-3 mt-2">
              {recentAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-slate-900 border-l-4 border-amber-400 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{announcement.title}</h3>
                      <p className="text-xs text-slate-400">{announcement.date}</p>
                    </div>
                    {announcement.isPinned && (
                      <span className="bg-amber-400 text-black text-xs px-2 py-1 font-bold">
                        PINNED
                      </span>
                    )}
                  </div>
                </div>
              ))}
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
            </div>
          </PixelCard>

          {/* Quest Board */}
          <PixelCard title="🎯 QUEST BOARD (MODUL)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {[
                { id: 1, title: 'Modul 1: React Hooks', status: 'active', xp: 100 },
                { id: 2, title: 'Modul 2: Context API', status: 'locked', xp: 0 },
                { id: 3, title: 'Modul 3: Redux', status: 'locked', xp: 0 },
              ].map((quest) => (
                <div
                  key={quest.id}
                  className={`bg-slate-900 border-b-4 p-4 ${
                    quest.status === 'active'
                      ? 'border-amber-400'
                      : 'border-slate-700 opacity-50'
                  }`}
                >
                  <div className="flex justify-between mb-2">
                    <span
                      className={`text-xs px-2 py-1 font-bold uppercase ${
                        quest.status === 'active'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {quest.status}
                    </span>
                    <Award size={16} className="text-amber-400" />
                  </div>
                  <h3 className="font-bold text-sm mb-2">{quest.title}</h3>
                  <p className="text-xs text-slate-400">{quest.xp} XP Earned</p>
                </div>
              ))}
            </div>
          </PixelCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
