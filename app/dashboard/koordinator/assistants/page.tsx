import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { createAssistant } from '@/app/actions/koordinator';

const navItems = [
  { href: '/dashboard/koordinator', label: 'Analytics', icon: 'TrendingUp' },
  { href: '/dashboard/koordinator/assistants', label: 'Assistants', icon: 'Users' },
];

export default async function AssistantsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'KOORDINATOR') redirect('/login');

  const assistants = await prisma.user.findMany({
      where: { role: 'ASISTEN' },
      include: {
          assistantPlottings: true,
          grades: true // Count grades approved
      }
  });

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">ASSISTANT MANAGEMENT</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
              <PixelCard title="ASSISTANT LIST">
                  <div className="space-y-2">
                      {assistants.map(ast => (
                          <div key={ast.id} className="bg-slate-900 border border-slate-700 p-3 flex justify-between items-center">
                              <div>
                                  <p className="font-bold text-white">{ast.name} ({ast.username})</p>
                                  <p className="text-xs text-slate-400">NIM: {ast.nim}</p>
                              </div>
                              <div className="text-right text-xs">
                                  <p className="text-emerald-400">{ast.assistantPlottings.length} Plots</p>
                                  <p className="text-indigo-400">{ast.grades.length} Grades Approved</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </PixelCard>
          </div>

          <div>
              <PixelCard title="ADD NEW ASSISTANT">
                  <form action={async (formData) => {
                      'use server';
                      await createAssistant({
                          name: formData.get('name') as string,
                          username: formData.get('username') as string,
                          nim: formData.get('nim') as string,
                          email: formData.get('email') as string
                      });
                  }}>
                      <div className="space-y-4">
                          <input name="name" placeholder="Full Name" className="w-full p-2 bg-black text-sm" required />
                          <input name="username" placeholder="Kode Asprak (e.g. ABC)" className="w-full p-2 bg-black text-sm" required />
                          <input name="nim" placeholder="NIM" className="w-full p-2 bg-black text-sm" required />
                          <input name="email" type="email" placeholder="Email (Optional)" className="w-full p-2 bg-black text-sm" />
                          <PixelButton type="submit" variant="primary" className="w-full">CREATE ACCOUNT</PixelButton>
                      </div>
                  </form>
              </PixelCard>
          </div>
      </div>
    </DashboardLayout>
  );
}

