import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, StatusBar } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { TrendingUp, UserX, Award, AlertTriangle } from 'lucide-react';

const navItems = [
  { href: '/dashboard/koordinator', label: 'Analytics', icon: 'TrendingUp' },
  { href: '/dashboard/koordinator/assistants', label: 'Assistants', icon: 'Users' },
];

export default async function KoordinatorDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'KOORDINATOR') redirect('/login');

  // Calculate Stats
  const totalStudents = await prisma.user.count({ where: { role: 'PRAKTIKAN' } });
  
  // Average Grade
  const grades = await prisma.grade.findMany({ 
      where: { status: 'APPROVED' },
      select: { score: true }
  });
  const avgGrade = grades.length > 0 
    ? grades.reduce((a, b) => a + b.score, 0) / grades.length 
    : 0;

  // Attendance Rate
  const totalAttendance = await prisma.attendance.count();
  const presentAttendance = await prisma.attendance.count({ 
      where: { status: { in: ['PRESENT', 'LATE'] } } 
  });
  const attendanceRate = totalAttendance > 0 
    ? Math.round((presentAttendance / totalAttendance) * 100) 
    : 0;

  // Violation Count
  const violations = await prisma.violation.count();

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">ANALYTICS DASHBOARD</h1>
        <p className="text-slate-400">Monitor course performance and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Avg Score</p>
                     <p className="text-2xl font-bold text-emerald-400">{avgGrade.toFixed(1)}</p>
                 </div>
                 <TrendingUp className="text-emerald-400" size={32} />
             </div>
         </PixelCard>
         
         <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Attendance</p>
                     <p className="text-2xl font-bold text-indigo-400">{attendanceRate}%</p>
                 </div>
                 <UserX className="text-indigo-400" size={32} />
             </div>
         </PixelCard>

         <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Graded Subs</p>
                     <p className="text-2xl font-bold text-amber-400">{grades.length}</p>
                 </div>
                 <Award className="text-amber-400" size={32} />
             </div>
         </PixelCard>

         <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Violations</p>
                     <p className="text-2xl font-bold text-rose-400">{violations}</p>
                 </div>
                 <AlertTriangle className="text-rose-400" size={32} />
             </div>
         </PixelCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PixelCard title="SCORE DISTRIBUTION">
              <div className="space-y-4 mt-2">
                  <StatusBar label="A (>= 80)" current={grades.filter(g => g.score >= 80).length} max={grades.length || 1} color="bg-emerald-500" icon={Award} />
                  <StatusBar label="B (70-79)" current={grades.filter(g => g.score >= 70 && g.score < 80).length} max={grades.length || 1} color="bg-indigo-500" icon={Award} />
                  <StatusBar label="C (60-69)" current={grades.filter(g => g.score >= 60 && g.score < 70).length} max={grades.length || 1} color="bg-amber-500" icon={Award} />
                  <StatusBar label="D/E (< 60)" current={grades.filter(g => g.score < 60).length} max={grades.length || 1} color="bg-rose-500" icon={AlertTriangle} />
              </div>
          </PixelCard>

          <PixelCard title="RECENT ACTIVITY">
             <div className="text-center py-12 text-slate-500 italic">
                 Real-time activity feed coming soon.
             </div>
          </PixelCard>
      </div>
    </DashboardLayout>
  );
}
