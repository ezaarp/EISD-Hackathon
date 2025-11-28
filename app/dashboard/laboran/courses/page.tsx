import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { createCourse } from '@/app/actions/laboran';
import CourseCard from './_components/CourseCard';

const navItems = [
  { href: '/dashboard/laboran', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/laboran/courses', label: 'Courses', icon: 'BookOpen' },
  { href: '/dashboard/laboran/resources', label: 'Resources', icon: 'Settings' },
];

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'LABORAN') redirect('/login');

  const courses = await prisma.course.findMany({
      include: { shifts: true },
      orderBy: { createdAt: 'desc' }
  });

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-pixel text-white mb-2">COURSE MANAGEMENT</h1>
            <p className="text-slate-400">Create and manage courses and shifts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
              {courses.map(course => (
                  <CourseCard key={course.id} course={course} />
              ))}
          </div>

          <div className="space-y-6">
              <PixelCard title="CREATE NEW COURSE">
                  <form action={async (formData) => {
                      'use server';
                      await createCourse({
                          code: formData.get('code') as string,
                          title: formData.get('title') as string,
                          description: formData.get('description') as string,
                          enrollPassword: formData.get('password') as string,
                          semester: '2024/2025 Genap',
                          academicYear: '2024/2025'
                      });
                  }}>
                      <div className="space-y-4">
                          <input name="code" placeholder="Course Code (e.g. WAD2025)" className="w-full p-2 bg-slate-900 border border-slate-600 text-white" required />
                          <input name="title" placeholder="Course Title" className="w-full p-2 bg-slate-900 border border-slate-600 text-white" required />
                          <textarea name="description" placeholder="Description" className="w-full p-2 bg-slate-900 border border-slate-600 text-white" />
                          <input name="password" type="password" placeholder="Enrollment Password" className="w-full p-2 bg-slate-900 border border-slate-600 text-white" required />
                          
                          <PixelButton type="submit" variant="primary" className="w-full">
                              CREATE COURSE
                          </PixelButton>
                      </div>
                  </form>
              </PixelCard>
          </div>
      </div>
    </DashboardLayout>
  );
}
