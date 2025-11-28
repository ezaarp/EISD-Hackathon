import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import BulkCreateForm from './_components/BulkCreateForm';
import { prisma } from '@/lib/prisma';
import { PixelCard } from '@/components/ui';

const navItems = [
    { href: '/dashboard/sekretaris', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/sekretaris/users', label: 'Users', icon: 'Users' },
    { href: '/dashboard/sekretaris/plotting', label: 'Plotting', icon: 'Settings' },
];

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SEKRETARIS') redirect('/login');

  const recentStudents = await prisma.user.findMany({
      where: { role: 'PRAKTIKAN' },
      orderBy: { createdAt: 'desc' },
      take: 10
  });

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">USER MANAGEMENT</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BulkCreateForm />
          
          <PixelCard title="RECENTLY ADDED">
              <div className="space-y-2">
                  {recentStudents.length === 0 ? (
                      <p className="text-slate-500 italic">No students yet.</p>
                  ) : (
                      recentStudents.map(student => (
                          <div key={student.id} className="p-2 border-b border-slate-700 flex justify-between items-center">
                              <div>
                                  <p className="font-bold text-white text-sm">{student.name}</p>
                                  <p className="text-xs text-slate-400">{student.username}</p>
                              </div>
                              <span className="text-xs text-emerald-500">Active</span>
                          </div>
                      ))
                  )}
              </div>
          </PixelCard>
      </div>
    </DashboardLayout>
  );
}

