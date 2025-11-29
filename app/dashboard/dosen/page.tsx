import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, StatusBar } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { TrendingUp, Award } from 'lucide-react';

const navItems = [
  { href: '/dashboard/dosen', label: 'Overview', icon: 'Home' },
  { href: '/dashboard/dosen/analytics', label: 'Analytics', icon: 'TrendingUp' },
];

export default async function DosenDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'DOSEN') redirect('/login');

  // Detailed Stats
  const course = await prisma.course.findFirst({ where: { isActive: true } });
  
  // Grades
  const grades = await prisma.grade.findMany({ where: { status: 'APPROVED' } });
  const avgScore = grades.length > 0 ? grades.reduce((a, b) => a + b.score, 0) / grades.length : 0;

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">DOSEN SUPERVISOR</h1>
        <p className="text-slate-400">Overview of {course?.code || 'Active Course'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
               <PixelCard title="PERFORMANCE OVERVIEW">
                   <div className="h-64 flex items-end justify-between gap-2 p-4 border-b border-slate-700">
                       {/* Mock Chart */}
                       {[65, 70, 75, 60, 80, 85, 90, 88, 92, 85, 80, 95, 85, 90].map((h, i) => (
                           <div key={i} className="w-full bg-indigo-500 hover:bg-indigo-400 transition-all relative group" style={{ height: `${h}%` }}>
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-xs p-1 opacity-0 group-hover:opacity-100 pointer-events-none">
                                   {h}
                               </div>
                           </div>
                       ))}
                   </div>
                   <p className="text-center text-xs text-slate-400 mt-2">Class Performance Distribution (Weeks 1-14)</p>
               </PixelCard>

               <div className="grid grid-cols-2 gap-4">
                   <PixelCard title="AVG SCORE">
                       <div className="flex items-center gap-4">
                           <Award size={40} className="text-emerald-400" />
                           <div>
                               <p className="text-3xl font-bold text-white">{avgScore.toFixed(1)}</p>
                               <p className="text-xs text-emerald-500">+2.4% vs last year</p>
                           </div>
                       </div>
                   </PixelCard>
                   <PixelCard title="PASS RATE">
                        <div className="flex items-center gap-4">
                           <TrendingUp size={40} className="text-indigo-400" />
                           <div>
                               <p className="text-3xl font-bold text-white">94%</p>
                               <p className="text-xs text-indigo-500">Stable</p>
                           </div>
                       </div>
                   </PixelCard>
               </div>
          </div>

          <div className="space-y-6">
              <PixelCard title="RECENT ACTIVITY">
                   <div className="space-y-4">
                       {[1,2,3].map(i => (
                           <div key={i} className="text-sm text-slate-400 border-b border-slate-800 pb-2">
                               <span className="font-bold text-white">Asisten {i}</span> finalized grades for Week {i}.
                           </div>
                       ))}
                   </div>
              </PixelCard>

              <PixelCard title="APPROVALS NEEDED">
                  <div className="text-center text-slate-500 italic py-4">
                      No pending approvals.
                  </div>
              </PixelCard>
          </div>
      </div>
    </DashboardLayout>
  );
}
