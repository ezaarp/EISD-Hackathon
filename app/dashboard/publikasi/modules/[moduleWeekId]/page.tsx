import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { createContent, createTask } from '@/app/actions/publikasi';
import { FileText, CheckSquare, Upload, Plus } from 'lucide-react';

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Materials */}
          <PixelCard title="MATERIALS">
              <div className="space-y-4 mb-6">
                  {moduleWeek.contents.map(c => (
                      <div key={c.id} className="p-3 bg-slate-900 border border-slate-700 flex justify-between">
                          <span>{c.title}</span>
                          <span className="text-xs bg-slate-700 px-2 py-1">{c.type}</span>
                      </div>
                  ))}
              </div>
              
              <form action={async (formData) => {
                  'use server';
                  await createContent(moduleWeek.id, {
                      title: formData.get('title') as string,
                      type: formData.get('type') as any,
                      storagePath: 'placeholder/path.pdf'
                  });
              }} className="border-t border-slate-700 pt-4">
                  <p className="text-xs font-bold text-slate-400 mb-2">ADD MATERIAL</p>
                  <div className="space-y-2">
                      <input name="title" placeholder="Title" className="w-full bg-black p-2 text-sm" required />
                      <select name="type" className="w-full bg-black p-2 text-sm">
                          <option value="PDF">PDF</option>
                          <option value="PPT_PDF">PPT (PDF)</option>
                          <option value="VIDEO">VIDEO</option>
                      </select>
                      <PixelButton type="submit" variant="secondary" className="w-full">ADD</PixelButton>
                  </div>
              </form>
          </PixelCard>

          {/* Tasks */}
          <PixelCard title="TASKS & QUESTIONS">
              <div className="space-y-6 mb-6">
                  {moduleWeek.tasks.map(t => (
                      <div key={t.id} className="bg-slate-900 border border-slate-700 p-4">
                          <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-emerald-400">{t.type}</span>
                              <span className="text-xs text-slate-500">{t.questions.length} Questions</span>
                          </div>
                          <p className="text-sm text-white mb-2">{t.title}</p>
                          {/* Placeholder for adding questions to task */}
                          <PixelButton variant="outline" className="text-xs w-full">
                              + ADD QUESTION (Coming Soon)
                          </PixelButton>
                      </div>
                  ))}
              </div>

              <form action={async (formData) => {
                  'use server';
                  await createTask(moduleWeek.id, {
                      title: formData.get('title') as string,
                      type: formData.get('type') as any,
                      instructions: formData.get('instructions') as string
                  });
              }} className="border-t border-slate-700 pt-4">
                  <p className="text-xs font-bold text-slate-400 mb-2">CREATE TASK</p>
                  <div className="space-y-2">
                      <select name="type" className="w-full bg-black p-2 text-sm">
                          <option value="TP">Tugas Pendahuluan</option>
                          <option value="PRETEST">Pre-Test</option>
                          <option value="JURNAL">Jurnal</option>
                          <option value="POSTTEST">Post-Test</option>
                      </select>
                      <input name="title" placeholder="Task Title" className="w-full bg-black p-2 text-sm" required />
                      <textarea name="instructions" placeholder="Instructions" className="w-full bg-black p-2 text-sm" />
                      <PixelButton type="submit" variant="primary" className="w-full">CREATE TASK</PixelButton>
                  </div>
              </form>
          </PixelCard>
      </div>
    </DashboardLayout>
  );
}
