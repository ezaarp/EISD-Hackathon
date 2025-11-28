import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { prisma } from '@/lib/prisma';
import ModuleManager from './_components/ModuleManager';

export default async function ModuleDetailPage(props: { params: Promise<{ moduleWeekId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PUBLIKASI') redirect('/login');

  const moduleWeek = await prisma.moduleWeek.findUnique({
      where: { id: params.moduleWeekId },
      include: { 
          contents: true,
          tasks: { include: { questions: true } }
      }
  });

  if (!moduleWeek) return <div>Module not found</div>;

  return (
    <DashboardLayout user={session.user} navItems={[{ href: '/dashboard/publikasi/modules', label: 'Back', icon: 'ArrowLeft' }]}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">{moduleWeek.title}</h1>
        <p className="text-slate-400">Content Management</p>
      </div>

      <ModuleManager moduleWeek={moduleWeek} />
    </DashboardLayout>
  );
}
