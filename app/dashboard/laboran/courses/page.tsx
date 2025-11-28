import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { createCourse, createShift } from '@/app/actions/laboran';
import { Plus, Calendar } from 'lucide-react';

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
                  <PixelCard key={course.id} title={course.code} className="mb-6">
                      <div className="mb-4">
                          <h3 className="text-xl font-bold text-white">{course.title}</h3>
                          <p className="text-slate-400 text-sm">{course.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {course.shifts.map(shift => (
                              <div key={shift.id} className="p-3 bg-slate-900 border border-slate-700">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <p className="font-bold text-emerald-400">{shift.name}</p>
                                          <p className="text-xs text-slate-400">{shift.day} • {shift.startTime}-{shift.endTime}</p>
                                          <p className="text-xs text-slate-500">{shift.room}</p>
                                      </div>
                                  </div>
                              </div>
                          ))}
                          <div className="p-3 bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-700">
                               <span className="text-xs text-slate-400">+ Add Shift (Coming Soon)</span>
                          </div>
                      </div>
                  </PixelCard>
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
