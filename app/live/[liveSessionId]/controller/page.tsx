import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLiveSession } from '@/app/actions/live-session';
import LiveControllerClient from './_components/LiveControllerClient';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelButton } from '@/components/ui';
import { ArrowLeft, Settings } from 'lucide-react';

export default async function LiveControllerPage(props: { params: Promise<{ liveSessionId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PUBLIKASI') {
    return redirect('/login');
  }

  const liveSession = await getLiveSession(params.liveSessionId);
  if (!liveSession) {
    return <div>Session not found</div>;
  }

  const navItems = [
    { href: '/dashboard/publikasi', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/publikasi/live-session', label: 'Live Session', icon: 'Radio' },
  ];

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <PixelButton href="/dashboard/publikasi/live-session" variant="outline" className="w-12 flex justify-center">
              <ArrowLeft size={20} />
            </PixelButton>
            <div>
              <h1 className="text-3xl font-pixel text-white mb-2">LIVE CONTROLLER</h1>
              <p className="text-slate-400">
                  Controling: <span className="text-emerald-400 font-bold">{liveSession.shift.course.code}</span> - {liveSession.shift.name}
              </p>
            </div>
          </div>
          <PixelButton 
            href={`/dashboard/publikasi/live-session/${params.liveSessionId}/edit`} 
            variant="secondary"
          >
            <Settings size={20} className="mr-2" />
            EDIT SESSION
          </PixelButton>
        </div>
      </div>

      <LiveControllerClient session={liveSession} liveSessionId={params.liveSessionId} />
    </DashboardLayout>
  );
}
