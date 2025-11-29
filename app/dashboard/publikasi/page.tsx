import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function PublikasiDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PUBLIKASI') {
    redirect('/login');
  }

  redirect('/dashboard/publikasi/live-session');
}
