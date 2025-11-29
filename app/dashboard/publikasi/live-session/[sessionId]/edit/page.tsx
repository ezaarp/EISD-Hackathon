import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelButton, PixelCard } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Upload } from 'lucide-react';
import EditLiveSessionForm from './_components/EditLiveSessionForm';

export default async function EditLiveSessionPage(props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PUBLIKASI') {
    redirect('/login');
  }

  const liveSession = await prisma.liveSession.findUnique({
    where: { id: params.sessionId },
    include: {
      shift: {
        include: {
          course: true
        }
      },
      moduleWeek: true
    }
  });

  if (!liveSession) {
    return <div>Session not found</div>;
  }

  // Fetch available shifts and modules for the course
  const course = await prisma.course.findUnique({
    where: { id: liveSession.shift.courseId },
    include: {
      shifts: true,
      modules: {
        where: { isActive: true },
        orderBy: { weekNo: 'asc' }
      }
    }
  });

  const navItems = [
    { href: '/dashboard/publikasi', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/publikasi/live-session', label: 'Live Session', icon: 'Radio' },
    { href: '/dashboard/publikasi/modules', label: 'Modules', icon: 'BookOpen' },
  ];

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8 flex items-center gap-4">
        <PixelButton href="/dashboard/publikasi/live-session" variant="outline" className="w-12 flex justify-center">
          <ArrowLeft size={20} />
        </PixelButton>
        <div>
          <h1 className="text-3xl font-pixel text-white mb-2">EDIT LIVE SESSION</h1>
          <p className="text-slate-400">{liveSession.shift.course.code} - {liveSession.shift.name}</p>
        </div>
      </div>

      <EditLiveSessionForm 
        liveSession={liveSession} 
        course={course}
      />
    </DashboardLayout>
  );
}

