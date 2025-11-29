import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const role = session.user.role;

  // Redirect to role-specific dashboard
  const roleRoutes: Record<string, string> = {
    PRAKTIKAN: '/dashboard/praktikan',
    ASISTEN: '/dashboard/asisten',
    KOORDINATOR: '/dashboard/koordinator',
    SEKRETARIS: '/dashboard/sekretaris',
    KOMDIS: '/dashboard/komdis',
    PUBLIKASI: '/dashboard/publikasi/live-session',
    MEDIA: '/dashboard/media',
    LABORAN: '/dashboard/laboran',
    DOSEN: '/dashboard/dosen',
  };

  const targetRoute = roleRoutes[role] || '/dashboard/praktikan';
  redirect(targetRoute);
}
