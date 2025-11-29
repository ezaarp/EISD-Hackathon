import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import BulkCreateForm from './_components/BulkCreateForm';
import UserList from './_components/UserList';
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
      take: 50 // Increased limit to show scrolling
  });

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">USER MANAGEMENT</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BulkCreateForm />
          
          <PixelCard title="STUDENT LIST">
              <UserList users={recentStudents} />
          </PixelCard>
      </div>
    </DashboardLayout>
  );
}
