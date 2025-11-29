import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import PlottingManager from './_components/PlottingManager';
import { getShiftsAndAssistants } from '@/app/actions/secretary';

const navItems = [
    { href: '/dashboard/sekretaris', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/sekretaris/users', label: 'Users', icon: 'Users' },
    { href: '/dashboard/sekretaris/plotting', label: 'Plotting', icon: 'Settings' },
];

export default async function PlottingPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SEKRETARIS') redirect('/login');

  const { shifts, assistants } = await getShiftsAndAssistants();

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">PLOTTING MANAGEMENT</h1>
        <p className="text-slate-400">Assign Assistants to Shifts & Plots</p>
      </div>

      <PlottingManager shifts={shifts} assistants={assistants} />
    </DashboardLayout>
  );
}

