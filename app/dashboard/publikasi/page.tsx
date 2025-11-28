import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard } from '@/components/ui';

const navItems = [
  { href: '/dashboard/publikasi', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/publikasi/modules', label: 'Modules', icon: 'BookOpen' },
  { href: '/dashboard/publikasi/live-session', label: 'Live Session', icon: 'Radio' },
  { href: '/dashboard/publikasi/announcements', label: 'Announcements', icon: 'FileText' },
];

export default async function PublikasiDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PUBLIKASI') {
    redirect('/login');
  }

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">PUBLIKASI DASHBOARD</h1>
        <p className="text-slate-400">Control content and live sessions</p>
      </div>

      <PixelCard title="🚧 UNDER CONSTRUCTION">
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">This page is under development</p>
          <p className="text-xs text-slate-600">
            Features: Upload materials, Create questions, Control live sessions
          </p>
        </div>
      </PixelCard>
    </DashboardLayout>
  );
}
