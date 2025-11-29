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

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'LABORAN') {
    redirect('/login');
  }

  // Fetch system settings
  const settings = await prisma.systemSetting.findMany({
    orderBy: {
      key: 'asc',
    },
  });

  const layoutUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? null,
    role: session.user.role,
  };

  return (
    <DashboardLayout user={layoutUser} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">SYSTEM SETTINGS</h1>
        <p className="text-slate-400">Configure system parameters and preferences</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <PixelCard title="GENERAL SETTINGS">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Default Session Duration (minutes)
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-2 text-white"
                  defaultValue="120"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Late Submission Penalty (%)
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-2 text-white"
                  defaultValue="20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Minimum Attendance Rate (%)
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-2 text-white"
                  defaultValue="80"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Auto-Save Interval (seconds)</label>
                <input
                  type="number"
                  className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-2 text-white"
                  defaultValue="30"
                />
              </div>
            </div>
          </div>
        </PixelCard>

        {/* Grading Weights */}
        <PixelCard title="GRADING WEIGHTS">
          <div className="space-y-4">
            <p className="text-xs text-slate-500 mb-4">Configure default grading weights for each component</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Attendance (%)</label>
                <input
                  type="number"
                  className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-2 text-white"
                  defaultValue="10"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Pretest (%)</label>
                <input
                  type="number"
                  className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-2 text-white"
                  defaultValue="15"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">TP Review (%)</label>
                <input
                  type="number"
                  className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-2 text-white"
                  defaultValue="20"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Journal (%)</label>
                <input
                  type="number"
                  className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-2 text-white"
                  defaultValue="30"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Posttest (%)</label>
                <input
                  type="number"
                  className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-2 text-white"
                  defaultValue="25"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="bg-yellow-500/20 border-2 border-yellow-500 p-4 mt-4">
              <p className="text-xs text-yellow-400">
                ⚠️ Total weight must equal 100%. Current total: <span className="font-bold">100%</span>
              </p>
            </div>
          </div>
        </PixelCard>

        {/* Database Settings */}
        <PixelCard title="SYSTEM INFORMATION">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-400 mb-2">Total Database Settings</p>
              <p className="text-3xl font-bold text-blue-400">{settings.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-2">System Status</p>
              <span className="text-xs font-bold px-3 py-1 bg-green-500 text-black">
                OPERATIONAL
              </span>
            </div>
          </div>

          {settings.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400 mb-4">Current Settings</p>
              <div className="space-y-2">
                {settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex justify-between items-center py-2 px-3 bg-slate-800/50"
                  >
                    <span className="text-sm text-white font-mono">{setting.key}</span>
                    <span className="text-sm text-green-400">{setting.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </PixelCard>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button className="pixel-btn bg-slate-600 hover:bg-slate-700 text-white">
            RESET TO DEFAULT
          </button>
          <button className="pixel-btn bg-green-500 hover:bg-green-600 text-black">
            SAVE CHANGES
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
