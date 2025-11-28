import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard } from '@/components/ui';
import prisma from '@/lib/prisma';

const navItems = [
  { href: '/dashboard/asisten', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/asisten/students', label: 'Students', icon: 'Users' },
  { href: '/dashboard/asisten/grading', label: 'Grading', icon: 'FileText' },
  { href: '/dashboard/asisten/ratings', label: 'Ratings', icon: 'Award' },
];

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ASISTEN') {
    redirect('/login');
  }

  // Fetch asisten's assigned students through plotting
  const plottings = await prisma.plotting.findMany({
    where: {
      assistantId: session.user.id,
    },
    include: {
      studentAssignments: {
        include: {
          student: {
            include: {
              grades: true,
              attendances: true,
              violationsReceived: true,
            },
          },
        },
      },
      shift: {
        include: {
          course: true,
        },
      },
      assistant: true,
    },
  });

  const students = plottings.flatMap((plotting) => {
    return plotting.studentAssignments.map((assignment) => {
      const student = assignment.student;
      const avgGrade =
        student.grades.length > 0
          ? student.grades.reduce((sum, g) => sum + g.finalScore, 0) / student.grades.length
          : 0;
      const attendanceRate =
        student.attendances.length > 0
          ? (student.attendances.filter((a) => a.status === 'PRESENT').length /
              student.attendances.length) *
            100
          : 0;

      return {
        id: student.id,
        username: student.username,
        name: student.name,
        shift: plotting.shift.name,
        course: plotting.shift.course.code,
        avgGrade: avgGrade.toFixed(1),
        attendanceRate: attendanceRate.toFixed(0),
        violationCount: student.violationsReceived.length,
        role: 'Main Assistant',
      };
    });
  });

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">MY STUDENTS</h1>
        <p className="text-slate-400">Manage your assigned students</p>
      </div>

      {students.length === 0 ? (
        <PixelCard title="NO STUDENTS ASSIGNED">
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">You don't have any students assigned yet</p>
            <p className="text-xs text-slate-600">
              Contact your coordinator for student assignments
            </p>
          </div>
        </PixelCard>
      ) : (
        <PixelCard title={`TOTAL STUDENTS: ${students.length}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-bold">NIM</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-bold">NAME</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-bold">SHIFT</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-bold">AVG GRADE</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-bold">ATTENDANCE</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-bold">VIOLATIONS</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-bold">ROLE</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-bold">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-slate-800 hover:bg-slate-800/50"
                  >
                    <td className="py-3 px-4 text-white font-mono">{student.username}</td>
                    <td className="py-3 px-4 text-white">{student.name}</td>
                    <td className="text-center py-3 px-4 text-slate-300">{student.shift}</td>
                    <td className="text-center py-3 px-4">
                      <span className="text-green-400 font-bold">{student.avgGrade}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`font-bold ${
                          parseInt(student.attendanceRate) >= 80
                            ? 'text-green-400'
                            : parseInt(student.attendanceRate) >= 60
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {student.attendanceRate}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {student.violationCount > 0 ? (
                        <span className="text-red-400 font-bold">{student.violationCount}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 ${
                          student.role === 'Main'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-600 text-white'
                        }`}
                      >
                        {student.role}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <Link
                        href={`/dashboard/asisten/students/${student.id}`}
                        className="pixel-btn bg-blue-500 hover:bg-blue-600 text-white text-xs"
                      >
                        DETAILS
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PixelCard>
      )}
    </DashboardLayout>
  );
}
