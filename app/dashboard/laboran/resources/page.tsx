import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard } from '@/components/ui';
import prisma from '@/lib/prisma';

const navItems = [
  { href: '/dashboard/laboran', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/laboran/courses', label: 'Courses', icon: 'BookOpen' },
  { href: '/dashboard/laboran/resources', label: 'Resources', icon: 'Users' },
  { href: '/dashboard/laboran/settings', label: 'Settings', icon: 'Settings' },
];

export default async function ResourcesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'LABORAN') {
    redirect('/login');
  }

  // Fetch users by role
  const [praktikans, asistens, dosens, allUsers] = await Promise.all([
    prisma.user.count({ where: { role: 'PRAKTIKAN' } }),
    prisma.user.count({ where: { role: 'ASISTEN' } }),
    prisma.user.count({ where: { role: 'DOSEN' } }),
    prisma.user.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const roleLabels: Record<string, string> = {
    PRAKTIKAN: 'Student',
    ASISTEN: 'Assistant',
    DOSEN: 'Lecturer',
    LABORAN: 'Lab Manager',
    KOORDINATOR: 'Coordinator',
    SEKRETARIS: 'Secretary',
    PUBLIKASI: 'Publication',
    KOMDIS: 'Discipline',
    MEDIA: 'Media',
    AI_SYSTEM: 'AI System',
  };

  const roleColors: Record<string, string> = {
    PRAKTIKAN: 'bg-blue-500 text-white',
    ASISTEN: 'bg-green-500 text-black',
    DOSEN: 'bg-purple-500 text-white',
    LABORAN: 'bg-yellow-500 text-black',
    KOORDINATOR: 'bg-red-500 text-white',
    SEKRETARIS: 'bg-indigo-500 text-white',
    PUBLIKASI: 'bg-pink-500 text-white',
    KOMDIS: 'bg-orange-500 text-black',
    MEDIA: 'bg-cyan-500 text-black',
    AI_SYSTEM: 'bg-slate-500 text-white',
  };

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">RESOURCES MANAGEMENT</h1>
        <p className="text-slate-400">Manage users and human resources</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <PixelCard title="PRAKTIKAN">
          <div className="text-center py-4">
            <p className="text-5xl font-bold text-blue-400">{praktikans}</p>
            <p className="text-xs text-slate-500 mt-2">Students</p>
          </div>
        </PixelCard>
        <PixelCard title="ASISTEN">
          <div className="text-center py-4">
            <p className="text-5xl font-bold text-green-400">{asistens}</p>
            <p className="text-xs text-slate-500 mt-2">Assistants</p>
          </div>
        </PixelCard>
        <PixelCard title="DOSEN">
          <div className="text-center py-4">
            <p className="text-5xl font-bold text-purple-400">{dosens}</p>
            <p className="text-xs text-slate-500 mt-2">Lecturers</p>
          </div>
        </PixelCard>
      </div>

      {/* Recent Users */}
      <PixelCard title={`ALL USERS (Last 50)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-bold">USERNAME</th>
                <th className="text-left py-3 px-4 text-slate-400 font-bold">NAME</th>
                <th className="text-center py-3 px-4 text-slate-400 font-bold">ROLE</th>
                <th className="text-center py-3 px-4 text-slate-400 font-bold">CREATED</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >
                  <td className="py-3 px-4 text-white font-mono">{user.username}</td>
                  <td className="py-3 px-4 text-white">{user.name}</td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`text-xs font-bold px-2 py-1 ${
                        roleColors[user.role] || 'bg-slate-600 text-white'
                      }`}
                    >
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-slate-400 text-xs">
                    {new Date(user.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PixelCard>
    </DashboardLayout>
  );
}
