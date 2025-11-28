import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { Users, FileText, Award } from 'lucide-react';

const navItems = [
  { href: '/dashboard/asisten', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/asisten/students', label: 'Students', icon: 'Users' },
  { href: '/dashboard/asisten/grading', label: 'Grading', icon: 'FileText' },
  { href: '/dashboard/asisten/ratings', label: 'Ratings', icon: 'Award' },
];

export default async function AsistenDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ASISTEN') redirect('/login');

  // Get assigned students
  const plottings = await prisma.plotting.findMany({
      where: { assistantId: session.user.id },
      include: { studentAssignments: true }
  });
  const studentCount = plottings.reduce((acc, p) => acc + p.studentAssignments.length, 0);

  // Get grading queue
  const pendingGrades = await prisma.submission.count({
      where: { 
          status: 'SUBMITTED',
          student: {
              enrollments: { some: { plotting: { assistantId: session.user.id } } }
          }
      }
  });

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">ASISTEN DASHBOARD</h1>
        <p className="text-slate-400">Welcome back, {session.user.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Assigned Students</p>
                     <p className="text-2xl font-bold text-emerald-400">{studentCount}</p>
                 </div>
                 <Users className="text-emerald-400" size={32} />
             </div>
          </PixelCard>

          <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">Pending Grading</p>
                     <p className="text-2xl font-bold text-amber-400">{pendingGrades}</p>
                 </div>
                 <FileText className="text-amber-400" size={32} />
             </div>
          </PixelCard>

          <PixelCard color="bg-slate-800">
             <div className="flex items-center justify-between">
                 <div>
                     <p className="text-xs text-slate-400 uppercase">My Rating</p>
                     <p className="text-2xl font-bold text-rose-400">4.8/5</p>
                 </div>
                 <Award className="text-rose-400" size={32} />
             </div>
          </PixelCard>
      </div>
    </DashboardLayout>
  );
}
