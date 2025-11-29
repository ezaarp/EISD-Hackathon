import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, StatusBar } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { TrendingUp, UserX, Award } from 'lucide-react';

const navItems = [
  { href: '/dashboard/dosen', label: 'Overview', icon: 'Home' },
  { href: '/dashboard/dosen/analytics', label: 'Analytics', icon: 'TrendingUp' },
];

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'DOSEN') redirect('/login');

  // Fetch all grades
  const grades = await prisma.grade.findMany({
      where: { status: 'APPROVED' },
      include: { submission: { include: { task: { include: { moduleWeek: true } } } } }
  });

  // Group by Module
  const moduleStats = grades.reduce((acc, g) => {
      const moduleName = g.submission.task.moduleWeek.title;
      if (!acc[moduleName]) acc[moduleName] = { total: 0, count: 0 };
      acc[moduleName].total += g.score;
      acc[moduleName].count += 1;
      return acc;
  }, {} as Record<string, { total: number, count: number }>);

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">DETAILED ANALYTICS</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PixelCard title="AVERAGE SCORE PER MODULE">
              <div className="space-y-4">
                  {Object.entries(moduleStats).map(([name, stat], idx) => (
                      <div key={name} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-400">
                              <span>{name}</span>
                              <span>{(stat.total / stat.count).toFixed(1)}</span>
                          </div>
                          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div 
                                  className="h-full bg-indigo-500" 
                                  style={{ width: `${(stat.total / stat.count)}%` }}
                              />
                          </div>
                      </div>
                  ))}
                  {Object.keys(moduleStats).length === 0 && <p className="text-slate-500">No data available.</p>}
              </div>
          </PixelCard>

          <PixelCard title="GRADE DISTRIBUTION">
              <div className="h-64 flex items-end justify-center gap-4">
                  <div className="w-12 bg-rose-500 flex items-end justify-center text-black font-bold text-xs" style={{ height: `${(grades.filter(g => g.score < 60).length / (grades.length || 1)) * 100}%` }}>E</div>
                  <div className="w-12 bg-amber-500 flex items-end justify-center text-black font-bold text-xs" style={{ height: `${(grades.filter(g => g.score >= 60 && g.score < 70).length / (grades.length || 1)) * 100}%` }}>C</div>
                  <div className="w-12 bg-indigo-500 flex items-end justify-center text-white font-bold text-xs" style={{ height: `${(grades.filter(g => g.score >= 70 && g.score < 80).length / (grades.length || 1)) * 100}%` }}>B</div>
                  <div className="w-12 bg-emerald-500 flex items-end justify-center text-black font-bold text-xs" style={{ height: `${(grades.filter(g => g.score >= 80).length / (grades.length || 1)) * 100}%` }}>A</div>
              </div>
          </PixelCard>
      </div>
    </DashboardLayout>
  );
}

