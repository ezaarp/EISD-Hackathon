import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { Plus, Folder } from 'lucide-react';
import { createModuleWeek } from '@/app/actions/publikasi';

async function handleCreateModule(formData: FormData) {
  'use server';
  const courseId = formData.get('courseId') as string;
  const weekNo = parseInt(formData.get('weekNo') as string, 10);
  const title = formData.get('title') as string;
  const description = (formData.get('description') as string) || '';
  const releaseAtStr = formData.get('releaseAt') as string;
  const deadlineTPStr = formData.get('deadlineTP') as string;

  await createModuleWeek({
    courseId,
    weekNo,
    title,
    description,
    releaseAt: releaseAtStr ? new Date(releaseAtStr) : new Date(),
    deadlineTP: deadlineTPStr ? new Date(deadlineTPStr) : null,
  });
}

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

  const courses = await prisma.course.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
  });

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">MODULE MANAGEMENT</h1>
        <p className="text-slate-400">Manage content, tasks, and questions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <PixelCard title="CREATE NEW MODULE" className="lg:col-span-3">
          <form action={handleCreateModule} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold">Course</label>
              <select
                name="courseId"
                className="w-full bg-slate-900 border border-slate-700 p-2 text-white"
                required
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold">Week No</label>
              <input
                type="number"
                name="weekNo"
                min={1}
                max={20}
                className="w-full bg-slate-900 border border-slate-700 p-2 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold">Title</label>
              <input
                type="text"
                name="title"
                placeholder="e.g. React Hooks"
                className="w-full bg-slate-900 border border-slate-700 p-2 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold">Release Date</label>
              <input
                type="datetime-local"
                name="releaseAt"
                className="w-full bg-slate-900 border border-slate-700 p-2 text-white"
                required
              />
            </div>

            <div className="md:col-span-2 lg:col-span-2 space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold">Description</label>
              <input
                type="text"
                name="description"
                placeholder="Short description"
                className="w-full bg-slate-900 border border-slate-700 p-2 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold">TP Deadline (optional)</label>
              <input
                type="datetime-local"
                name="deadlineTP"
                className="w-full bg-slate-900 border border-slate-700 p-2 text-white"
              />
            </div>

            <div className="flex items-end">
              <PixelButton type="submit" variant="primary" className="w-full">
                <Plus size={16} className="mr-2" />
                CREATE MODULE
              </PixelButton>
            </div>
          </form>
        </PixelCard>
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
