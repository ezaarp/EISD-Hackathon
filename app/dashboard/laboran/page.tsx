import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { BookOpen, Clock, Settings } from 'lucide-react';

const navItems = [
  { href: '/dashboard/laboran', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/laboran/courses', label: 'Courses', icon: 'BookOpen' },
  { href: '/dashboard/laboran/resources', label: 'Resources', icon: 'Settings' },
];

export default async function LaboranDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'LABORAN') redirect('/login');

  const courses = await prisma.course.count();
  const shifts = await prisma.shift.count();

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">LABORAN DASHBOARD</h1>
        <p className="text-slate-400">Manage courses and lab resources</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Total Courses</p>
                     <p className="text-2xl font-bold text-emerald-400">{courses}</p>
                 </div>
                 <BookOpen className="text-emerald-400" size={32} />
             </div>
          </PixelCard>

          <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Total Shifts</p>
                     <p className="text-2xl font-bold text-indigo-400">{shifts}</p>
                 </div>
                 <Clock className="text-indigo-400" size={32} />
             </div>
          </PixelCard>

          <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Lab Status</p>
                     <p className="text-2xl font-bold text-emerald-400">ONLINE</p>
                 </div>
                 <Settings className="text-emerald-400" size={32} />
             </div>
          </PixelCard>
      </div>
    </DashboardLayout>
  );
}
