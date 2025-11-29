import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { redirect } from 'next/navigation';
import { BookOpen, Clock, User } from 'lucide-react';

export default async function StudentCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PRAKTIKAN') return redirect('/login');

  const assignments = await prisma.studentAssignment.findMany({
    where: { studentId: session.user.id },
    include: {
      shift: {
        include: {
          course: true,
        },
      },
      plotting: {
        include: {
          assistant: true,
        },
      },
    },
  });

  const navItems = [
    { href: '/dashboard/praktikan', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/praktikan/courses', label: 'Courses', icon: 'BookOpen' },
    { href: '/dashboard/praktikan/assignments', label: 'Assignments', icon: 'FileText' },
    { href: '/dashboard/praktikan/grades', label: 'Grades', icon: 'Award' },
  ];

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">MY COURSES</h1>
        <p className="text-slate-400">Courses you are enrolled in</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {assignments.length === 0 ? (
            <PixelCard className="text-center py-12">
                <p className="text-slate-400">You are not enrolled in any courses yet.</p>
                <p className="text-xs text-slate-600 mt-2">Contact the Secretary if this is a mistake.</p>
            </PixelCard>
        ) : (
            assignments.map(assignment => (
                <PixelCard key={assignment.id} title={assignment.shift.course.code} color="bg-slate-800">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">{assignment.shift.course.title}</h3>
                            <p className="text-slate-400 text-sm">{assignment.shift.course.description}</p>
                            
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                    <Clock size={16} />
                                    <span>{assignment.shift.name} ({assignment.shift.day}, {assignment.shift.startTime})</span>
                                </div>
                                <div className="flex items-center gap-2 text-indigo-400 text-sm">
                                    <User size={16} />
                                    <span>Asisten: {assignment.plotting.assistant.name}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[200px]">
                             <PixelButton href={`/courses/${assignment.shift.course.id}/modules`} variant="primary">
                                <BookOpen size={16} className="mr-2" />
                                VIEW MODULES
                             </PixelButton>
                        </div>
                    </div>
                </PixelCard>
            ))
        )}
      </div>
    </DashboardLayout>
  );
}
