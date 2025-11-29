import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { createLiveSession } from '@/app/actions/live-session';
import { redirect } from 'next/navigation';
import { Play, Calendar, Clock, Edit } from 'lucide-react';

async function startSession(formData: FormData) {
  'use server';
  const shiftId = formData.get('shiftId') as string;
  const moduleWeekId = formData.get('moduleWeekId') as string;
  
  const existingDraft = await prisma.liveSession.findFirst({
    where: {
      shiftId,
      status: 'DRAFT',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingDraft) {
    return redirect(`/live/${existingDraft.id}/controller`);
  }

  const result = await createLiveSession(shiftId, moduleWeekId);
  if (result.success) {
    redirect(`/live/${result.sessionId}/controller`);
  }
}

export default async function LiveSessionDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PUBLIKASI') return redirect('/login');

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: {
      shifts: {
        include: {
          liveSessions: {
            where: { status: { in: ['ACTIVE', 'PAUSED'] } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          }
        }
      },
      modules: {
        where: { isActive: true },
        orderBy: { weekNo: 'asc' }
      }
    }
  });

  const navItems = [
    { href: '/dashboard/publikasi', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/publikasi/modules', label: 'Modules', icon: 'BookOpen' },
    { href: '/dashboard/publikasi/live-session', label: 'Live Session', icon: 'Radio' },
  ];

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-pixel text-white mb-2">LIVE SESSION CONTROL</h1>
          <p className="text-slate-400">Start and manage practical sessions</p>
        </div>
        <PixelButton href="/dashboard/publikasi/live-session/create" variant="success">
          + CUSTOM RUNDOWN
        </PixelButton>
      </div>

      <div className="space-y-8">
        {courses.map(course => (
          <div key={course.id} className="space-y-4">
            <h2 className="text-xl font-bold text-emerald-400 font-pixel border-b-4 border-emerald-500 inline-block pb-1">
              {course.code}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.shifts.map(shift => {
                const activeSession = shift.liveSessions[0];
                const nextModule = course.modules[0]; // Simply taking first active module for demo

                return (
                  <PixelCard 
                    key={shift.id} 
                    title={shift.name}
                    color={activeSession ? "bg-indigo-900/50" : "bg-slate-800"}
                    className={activeSession ? "border-indigo-500" : ""}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar size={16} />
                        <span>{shift.day}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock size={16} />
                        <span>{shift.startTime} - {shift.endTime}</span>
                      </div>

                      {activeSession ? (
                        <div className="mt-4 p-4 bg-indigo-900 border-2 border-indigo-500">
                          <p className="text-xs text-indigo-300 uppercase font-bold mb-2">Active Session</p>
                          <p className="font-pixel text-white mb-4">Stage: {activeSession.currentStageIndex}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <form action={async () => {
                              'use server';
                              redirect(`/live/${activeSession.id}/controller`);
                            }}>
                              <PixelButton type="submit" variant="primary" className="w-full">
                                RESUME
                              </PixelButton>
                            </form>
                            <PixelButton href={`/dashboard/publikasi/live-session/${activeSession.id}/edit`} variant="outline" className="w-full">
                              <Edit size={16} className="mr-1" />
                              EDIT
                            </PixelButton>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4">
                          {nextModule ? (
                            <form action={startSession}>
                              <input type="hidden" name="shiftId" value={shift.id} />
                              <input type="hidden" name="moduleWeekId" value={nextModule.id} />
                              <div className="mb-4 p-2 bg-slate-900 border border-slate-700 text-xs">
                                <p className="text-slate-400">Next Module:</p>
                                <p className="font-bold text-emerald-400 truncate">{nextModule.title}</p>
                              </div>
                              <PixelButton type="submit" variant="warning" className="w-full">
                                <Play size={16} className="mr-2" />
                                START SESSION
                              </PixelButton>
                            </form>
                          ) : (
                            <div className="p-4 bg-slate-900 border border-slate-700 text-center text-slate-500 text-sm">
                              No Active Modules
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </PixelCard>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
