import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { redirect } from 'next/navigation';
import { Lock, CheckCircle, Clock, ArrowRight } from 'lucide-react';

export default async function CourseModulesPage(props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) return redirect('/login');

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      modules: {
        orderBy: { weekNo: 'asc' },
      },
    },
  });

  if (!course) return <div>Course not found</div>;

  // Check enrollment for student (optional but good for security context)
  // For now assuming access if logged in (RBAC middleware handles route protection mostly)

  const navItems = [
    { href: '/dashboard/praktikan', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/praktikan/courses', label: 'Courses', icon: 'BookOpen' },
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
        <div className="flex items-center gap-4">
             <PixelButton href="/dashboard/praktikan/courses" variant="outline" className="w-12 flex justify-center">
                 ←
             </PixelButton>
             <div>
                <h1 className="text-3xl font-pixel text-white mb-2">{course.code} MODULES</h1>
                <p className="text-slate-400">{course.title}</p>
             </div>
        </div>
      </div>

      <div className="space-y-4">
        {course.modules.map(module => {
            const isLocked = new Date() < new Date(module.releaseAt);
            
            return (
                <PixelCard 
                    key={module.id} 
                    title={`WEEK ${module.weekNo}: ${module.title}`}
                    color={isLocked ? "bg-slate-800/50" : "bg-slate-800"}
                    className={isLocked ? "opacity-75" : ""}
                >
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <p className="text-slate-300">{module.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    <span>Released: {new Date(module.releaseAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            {isLocked ? (
                                <div className="flex items-center gap-2 text-slate-500 bg-slate-900 px-4 py-2 border border-slate-700">
                                    <Lock size={16} />
                                    <span className="font-bold text-xs uppercase">LOCKED</span>
                                </div>
                            ) : (
                                <PixelButton href={`/courses/${course.id}/modules/${module.id}`} variant="primary">
                                    OPEN MODULE
                                    <ArrowRight size={16} className="ml-2" />
                                </PixelButton>
                            )}
                        </div>
                    </div>
                </PixelCard>
            );
        })}
      </div>
    </DashboardLayout>
  );
}

