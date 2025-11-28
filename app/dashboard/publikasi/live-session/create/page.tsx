import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelButton, PixelCard } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { ArrowLeft } from 'lucide-react';
import CreateLiveSessionForm from './_components/CreateLiveSessionForm';

export default async function CreateLiveSessionPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PUBLIKASI') {
    redirect('/login');
  }

  // Fetch available courses and shifts
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: {
      shifts: {
        include: {
          _count: {
            select: { studentAssignments: true }
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
    { href: '/dashboard/publikasi/live-session', label: 'Live Session', icon: 'Radio' },
    { href: '/dashboard/publikasi/modules', label: 'Modules', icon: 'BookOpen' },
  ];

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8 flex items-center gap-4">
        <PixelButton href="/dashboard/publikasi/live-session" variant="outline" className="w-12 flex justify-center">
          <ArrowLeft size={20} />
        </PixelButton>
        <div>
          <h1 className="text-3xl font-pixel text-white mb-2">CREATE LIVE SESSION</h1>
          <p className="text-slate-400">Setup a new live session with custom rundown</p>
        </div>
      </div>

      <CreateLiveSessionForm courses={courses} userId={session.user.id} />
    </DashboardLayout>
  );
}

