import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { Plus, Folder } from 'lucide-react';

const navItems = [
  { href: '/dashboard/publikasi/live-session', label: 'Live Session', icon: 'Radio' },
  { href: '/dashboard/publikasi/modules', label: 'Modules', icon: 'BookOpen' },
];

export default async function ModulesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PUBLIKASI') redirect('/login');

  const modules = await prisma.moduleWeek.findMany({
      include: { course: true, _count: { select: { tasks: true, contents: true } } },
      orderBy: { weekNo: 'asc' }
  });

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">MODULE MANAGEMENT</h1>
        <p className="text-slate-400">Manage content, tasks, and questions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(mod => (
              <PixelCard key={mod.id} title={`WEEK ${mod.weekNo}`}>
                  <div className="space-y-4">
                      <h3 className="font-bold text-white">{mod.title}</h3>
                      <p className="text-xs text-slate-400">{mod.course.code}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-900 p-2 text-center">
                              <p className="font-bold text-emerald-400">{mod._count.contents}</p>
                              <p className="text-slate-500">Materials</p>
                          </div>
                          <div className="bg-slate-900 p-2 text-center">
                              <p className="font-bold text-amber-400">{mod._count.tasks}</p>
                              <p className="text-slate-500">Tasks</p>
                          </div>
                      </div>

                      <PixelButton href={`/dashboard/publikasi/modules/${mod.id}`} variant="secondary" className="w-full">
                          MANAGE CONTENT
                      </PixelButton>
                  </div>
              </PixelCard>
          ))}
      </div>
    </DashboardLayout>
  );
}
