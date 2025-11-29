import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { ShieldAlert } from 'lucide-react';

const navItems = [
    { href: '/dashboard/komdis', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/komdis/attendance', label: 'Attendance', icon: 'CheckCircle' },
    { href: '/dashboard/komdis/violations', label: 'Violations', icon: 'ShieldAlert' },
];

export default async function ViolationsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'KOMDIS') redirect('/login');

  const violations = await prisma.violation.findMany({
      include: { student: true },
      orderBy: { createdAt: 'desc' }
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
        <h1 className="text-3xl font-pixel text-white mb-2">VIOLATIONS RECORD</h1>
        <p className="text-slate-400">Manage and review student violations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
              <PixelCard title="VIOLATION HISTORY">
                  <div className="space-y-4">
                      {violations.length === 0 ? (
                          <p className="text-slate-500 italic text-center py-8">No violations recorded.</p>
                      ) : (
                          violations.map(v => (
                              <div key={v.id} className="bg-slate-900 border border-slate-700 p-4 flex justify-between items-start">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className="font-bold text-white">{v.student.name}</span>
                                          <span className="text-xs text-slate-400">({v.student.username})</span>
                                      </div>
                                      <p className="text-sm text-rose-400 font-bold">{v.type}</p>
                                      <p className="text-xs text-slate-300 mt-1">{v.description}</p>
                                  </div>
                                  <div className="text-right">
                                      <span className="block text-xl font-pixel text-rose-500">-{v.points} HP</span>
                                      <span className="text-xs text-slate-500">{new Date(v.createdAt).toLocaleDateString()}</span>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </PixelCard>
          </div>

          <div>
              <PixelCard title="REPORT VIOLATION">
                  <div className="text-center py-8 text-slate-500 italic">
                      <ShieldAlert size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Violation reporting is currently handled via Live Session Attendance or Direct Report.</p>
                  </div>
              </PixelCard>
          </div>
      </div>
    </DashboardLayout>
  );
}

