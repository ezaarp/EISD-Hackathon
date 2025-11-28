import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard } from '@/components/ui';

const navItems = [
  { href: '/dashboard/asisten', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/asisten/students', label: 'Students', icon: 'Users' },
  { href: '/dashboard/asisten/grading', label: 'Grading', icon: 'FileText' },
  { href: '/dashboard/asisten/ratings', label: 'Ratings', icon: 'Award' },
];

export default async function AsistenDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ASISTEN') {
    redirect('/login');
  }

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">ASISTEN DASHBOARD</h1>
        <p className="text-slate-400">Manage students and grading</p>
      </div>

      <PixelCard title="🚧 UNDER CONSTRUCTION">
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">This page is under development</p>
          <p className="text-xs text-slate-600">
            Features: View students, Grade submissions, Monitor live sessions
          </p>
        </div>
      </PixelCard>
    </DashboardLayout>
  );
}
