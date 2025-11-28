import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';

const navItems = [
  { href: '/dashboard/asisten', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/asisten/students', label: 'Students', icon: 'Users' },
  { href: '/dashboard/asisten/grading', label: 'Grading', icon: 'FileText' },
  { href: '/dashboard/asisten/ratings', label: 'Ratings', icon: 'Award' },
];

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ASISTEN') redirect('/login');

  const plottings = await prisma.plotting.findMany({
      where: { assistantId: session.user.id },
      include: { 
          shift: { include: { course: true } },
          studentAssignments: { 
              include: { 
                  student: {
                      include: { 
                          attendances: true,
                          grades: true,
                          violationsReceived: true
                      }
                  }
              } 
          }
      }
  });

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">MY STUDENTS</h1>
      </div>

      {plottings.map(plot => (
          <PixelCard key={plot.id} title={`${plot.shift.course.code} - ${plot.shift.name}`} className="mb-6">
              <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                      <thead>
                          <tr className="border-b-2 border-slate-700 text-slate-400 text-left">
                              <th className="p-3">NIM</th>
                              <th className="p-3">NAME</th>
                              <th className="p-3 text-center">ATTENDANCE</th>
                              <th className="p-3 text-center">AVG GRADE</th>
                              <th className="p-3 text-center">ROLE</th>
                              <th className="p-3 text-right">ACTION</th>
                          </tr>
                      </thead>
                      <tbody>
                          {plot.studentAssignments.map(sa => {
                              const presentCount = sa.student.attendances.filter(a => a.status === 'PRESENT').length;
                              const totalAtt = sa.student.attendances.length || 1;
                              const avgGrade = sa.student.grades.length > 0 
                                  ? sa.student.grades.reduce((a, b) => a + b.score, 0) / sa.student.grades.length 
                                  : 0;

                              return (
                                  <tr key={sa.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                                      <td className="p-3 font-mono text-slate-300">{sa.student.username}</td>
                                      <td className="p-3 font-bold text-white">{sa.student.name}</td>
                                      <td className="p-3 text-center text-emerald-400">
                                          {Math.round((presentCount / totalAtt) * 100)}%
                                      </td>
                                      <td className="p-3 text-center text-amber-400">
                                          {avgGrade.toFixed(1)}
                                      </td>
                                      <td className="p-3 text-center text-slate-400 text-xs uppercase">
                                          {sa.student.role}
                                      </td>
                                      <td className="p-3 text-right">
                                          <PixelButton href={`/dashboard/asisten/students/${sa.student.id}`} variant="secondary" className="text-xs py-1 px-2">
                                              DETAILS
                                          </PixelButton>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </PixelCard>
      ))}
    </DashboardLayout>
  );
}
