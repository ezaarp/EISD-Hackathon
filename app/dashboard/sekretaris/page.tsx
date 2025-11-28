import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { Users, BookOpen, Calendar } from 'lucide-react';

const navItems = [
  { href: '/dashboard/sekretaris', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/sekretaris/users', label: 'Users', icon: 'Users' },
  { href: '/dashboard/sekretaris/plotting', label: 'Plotting', icon: 'Settings' },
];

export default async function SekretarisDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SEKRETARIS') {
    redirect('/login');
  }

  // Stats
  const studentCount = await prisma.user.count({ where: { role: 'PRAKTIKAN' } });
  const assistantCount = await prisma.user.count({ where: { role: 'ASISTEN' } });
  const courseCount = await prisma.course.count({ where: { isActive: true } });
  const shiftCount = await prisma.shift.count({ where: { status: 'ACTIVE' } });

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">SEKRETARIS DASHBOARD</h1>
        <p className="text-slate-400">Overview of Laboratory Resources</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Total Students</p>
                     <p className="text-2xl font-bold text-emerald-400">{studentCount}</p>
                 </div>
                 <Users className="text-emerald-400" size={32} />
             </div>
          </PixelCard>

          <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Total Assistants</p>
                     <p className="text-2xl font-bold text-indigo-400">{assistantCount}</p>
                 </div>
                 <Users className="text-indigo-400" size={32} />
             </div>
          </PixelCard>

           <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Active Courses</p>
                     <p className="text-2xl font-bold text-amber-400">{courseCount}</p>
                 </div>
                 <BookOpen className="text-amber-400" size={32} />
             </div>
          </PixelCard>

           <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Total Shifts</p>
                     <p className="text-2xl font-bold text-rose-400">{shiftCount}</p>
                 </div>
                 <Calendar className="text-rose-400" size={32} />
             </div>
          </PixelCard>
      </div>
    </DashboardLayout>
  );
}
