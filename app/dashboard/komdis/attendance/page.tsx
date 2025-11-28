import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import AttendanceManager from './_components/AttendanceManager';
import { prisma } from '@/lib/prisma';
import { PixelCard } from '@/components/ui';

const navItems = [
    { href: '/dashboard/komdis', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/komdis/attendance', label: 'Attendance', icon: 'CheckCircle' },
    { href: '/dashboard/komdis/violations', label: 'Violations', icon: 'ShieldAlert' },
];

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'KOMDIS') redirect('/login');

  // Find ACTIVE sessions
  const activeSessions = await prisma.liveSession.findMany({
      where: { status: 'ACTIVE' },
      include: {
          shift: {
              include: {
                  studentAssignments: {
                      include: { student: true }
                  }
              }
          },
          attendances: true
      }
  });

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">LIVE ATTENDANCE</h1>
        <p className="text-slate-400">Mark attendance for active sessions</p>
      </div>

      {activeSessions.length === 0 ? (
          <PixelCard>
              <div className="text-center py-12 text-slate-500">
                  No active live sessions at the moment.
              </div>
          </PixelCard>
      ) : (
          <div className="space-y-8">
              {activeSessions.map(s => (
                  <AttendanceManager 
                    key={s.id} 
                    session={s} 
                    students={s.shift.studentAssignments.map(sa => sa.student)}
                    attendances={s.attendances}
                  />
              ))}
          </div>
      )}
    </DashboardLayout>
  );
}

