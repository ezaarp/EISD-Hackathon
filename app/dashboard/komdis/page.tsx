import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { ShieldAlert, Users, CheckCircle, AlertTriangle } from 'lucide-react';

const navItems = [
  { href: '/dashboard/komdis', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/komdis/attendance', label: 'Attendance', icon: 'CheckCircle' },
  { href: '/dashboard/komdis/violations', label: 'Violations', icon: 'ShieldAlert' },
];

export default async function KomdisDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'KOMDIS') {
    redirect('/login');
  }

  // Stats
  const totalViolations = await prisma.violation.count();
  const recentViolations = await prisma.violation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { student: true }
  });

  const activeSessions = await prisma.liveSession.count({
      where: { status: 'ACTIVE' }
  });

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">KOMDIS DASHBOARD</h1>
        <p className="text-slate-400">Enforce discipline and manage attendance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Total Violations</p>
                     <p className="text-2xl font-bold text-rose-400">{totalViolations}</p>
                 </div>
                 <ShieldAlert className="text-rose-400" size={32} />
             </div>
          </PixelCard>

          <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Active Sessions</p>
                     <p className="text-2xl font-bold text-emerald-400">{activeSessions}</p>
                 </div>
                 <Users className="text-emerald-400" size={32} />
             </div>
          </PixelCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PixelCard title="RECENT VIOLATIONS">
              <div className="space-y-4">
                  {recentViolations.map(v => (
                      <div key={v.id} className="p-3 bg-slate-900 border border-slate-700 flex justify-between items-center">
                          <div>
                              <p className="font-bold text-white">{v.student.name}</p>
                              <p className="text-xs text-rose-400">{v.type} - {v.points} pts</p>
                          </div>
                          <span className="text-xs text-slate-500">
                              {new Date(v.createdAt).toLocaleDateString()}
                          </span>
                      </div>
                  ))}
                  {recentViolations.length === 0 && <p className="text-slate-500 italic">No violations recorded.</p>}
              </div>
          </PixelCard>
      </div>
    </DashboardLayout>
  );
}
