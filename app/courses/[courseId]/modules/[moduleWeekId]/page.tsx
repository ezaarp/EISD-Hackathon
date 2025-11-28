import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { redirect } from 'next/navigation';
import { FileText, Download, Upload, Radio, CheckCircle } from 'lucide-react';
import { getActiveSessionForStudent } from '@/app/actions/live-session';
import { getFileUrl } from '@/lib/supabase';
import PDFViewer from '@/components/ui/PDFViewer';

export default async function ModuleDetailPage(props: { params: Promise<{ courseId: string, moduleWeekId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) return redirect('/login');

  const moduleWeek = await prisma.moduleWeek.findUnique({
    where: { id: params.moduleWeekId },
    include: {
        contents: {
            orderBy: { sortOrder: 'asc' }
        },
        tasks: {
            orderBy: { sortOrder: 'asc' }
        }
    }
  });

  if (!moduleWeek) return <div>Module not found</div>;

  // Check for active live session
  let activeSessionId = null;
  if (session.user.role === 'PRAKTIKAN') {
      const activeSession = await getActiveSessionForStudent(session.user.id);
      if (activeSession && activeSession.moduleWeekId === moduleWeek.id) {
          activeSessionId = activeSession.id;
      }
  }

  const navItems = [
    { href: '/dashboard/praktikan', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/praktikan/courses', label: 'Courses', icon: 'BookOpen' },
  ];

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <div className="flex items-center gap-4">
             <PixelButton href={`/courses/${params.courseId}/modules`} variant="outline" className="w-12 flex justify-center">
                 ←
             </PixelButton>
             <div>
                <h1 className="text-3xl font-pixel text-white mb-2">{moduleWeek.title}</h1>
                <p className="text-slate-400">Week {moduleWeek.weekNo}</p>
             </div>
        </div>
      </div>

      {activeSessionId && (
          <PixelCard className="mb-8 border-indigo-500 bg-indigo-900/20 animate-pulse-border">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                      <div>
                          <h3 className="font-bold text-white">LIVE SESSION IN PROGRESS</h3>
                          <p className="text-indigo-300 text-sm">The practical session for this module is live.</p>
                      </div>
                  </div>
                  <PixelButton href={`/live/${activeSessionId}`} variant="success">
                      <Radio size={16} className="mr-2" />
                      JOIN SESSION
                  </PixelButton>
              </div>
          </PixelCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              {/* Materials */}
              <section>
                  <h2 className="text-xl font-pixel text-emerald-400 mb-4">MATERIALS</h2>
                  <div className="space-y-8">
                      {moduleWeek.contents.length === 0 ? (
                          <p className="text-slate-500 italic">No materials uploaded yet.</p>
                      ) : (
                          moduleWeek.contents.map(content => (
                              <div key={content.id} className="space-y-2">
                                  <div className="bg-slate-800 border border-slate-700 p-4 flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                          <div className="bg-slate-900 p-3">
                                              <FileText className="text-emerald-400" />
                                          </div>
                                          <div>
                                              <h3 className="font-bold text-white">{content.title}</h3>
                                              <p className="text-xs text-slate-400 uppercase">{content.type}</p>
                                          </div>
                                      </div>
                                      <PixelButton variant="outline" className="text-xs">
                                          <Download size={14} className="mr-2" />
                                          DOWNLOAD
                                      </PixelButton>
                                  </div>
                                  
                                  {/* Embedded PDF Viewer if PDF */}
                                  {(content.type === 'PDF' || content.type === 'PPT_PDF') && (
                                      <PDFViewer url={getFileUrl('materials', content.storagePath)} />
                                  )}
                              </div>
                          ))
                      )}
                  </div>
              </section>

              {/* Tasks */}
              <section>
                  <h2 className="text-xl font-pixel text-amber-400 mb-4">TASKS</h2>
                  <div className="space-y-4">
                      {moduleWeek.tasks.map(task => (
                          <PixelCard key={task.id} title={task.type} color="bg-slate-800">
                              <div className="space-y-4">
                                  <h3 className="font-bold text-white">{task.title}</h3>
                                  <div className="prose prose-invert text-sm max-w-none" dangerouslySetInnerHTML={{ __html: task.instructions }} />
                                  
                                  <div className="flex gap-2 mt-4">
                                      {task.type === 'TP' && (
                                          <PixelButton variant="warning" className="w-full">
                                              <Upload size={16} className="mr-2" />
                                              SUBMIT TUGAS PENDAHULUAN
                                          </PixelButton>
                                      )}
                                       {(task.type === 'JURNAL' || task.type === 'PRETEST' || task.type === 'POSTTEST') && (
                                          <div className="w-full p-3 bg-slate-900 text-center text-slate-500 text-sm border border-dashed border-slate-700">
                                              {activeSessionId ? 'Go to Live Session to complete' : 'Only available during Live Session'}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </PixelCard>
                      ))}
                  </div>
              </section>
          </div>

          <div className="space-y-6">
               <PixelCard title="PROGRESS">
                   <div className="space-y-4">
                       <div className="flex items-center justify-between">
                           <span className="text-slate-300">TP Status</span>
                           <span className="text-rose-400 font-bold text-xs">NOT SUBMITTED</span>
                       </div>
                       <div className="flex items-center justify-between">
                           <span className="text-slate-300">Jurnal Status</span>
                           <span className="text-slate-500 text-xs">LOCKED</span>
                       </div>
                   </div>
               </PixelCard>
          </div>
      </div>
    </DashboardLayout>
  );
}
