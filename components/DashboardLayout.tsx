'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PixelButton } from './ui';
import {
  Home,
  BookOpen,
  Users,
  Settings,
  FileText,
  Bell,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Award,
  ShieldAlert,
  CheckSquare,
  Radio,
  Camera,
  Image,
  BarChart,
  FileCheck,
  FlaskConical,
  GraduationCap,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import { UserRole } from '@prisma/client';

// Icon mapping for string-based icons
const iconMap: Record<string, any> = {
  Home,
  BookOpen,
  Users,
  Settings,
  FileText,
  Award,
  ShieldAlert,
  CheckSquare,
  Radio,
  Camera,
  Image,
  BarChart,
  FileCheck,
  FlaskConical,
  GraduationCap,
  Plus,
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    username: string;
    name: string | null;
    role: UserRole;
  };
  navItems: Array<{
    href: string;
    label: string;
    icon: string; // Changed from 'any' to 'string'
  }>;
}

export default function DashboardLayout({ children, user, navItems }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 font-mono text-slate-200">
      {/* Top Header */}
      <header className="bg-slate-950 border-b-4 border-slate-800 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-white"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="w-8 h-8 bg-emerald-500 border-2 border-white animate-pulse"></div>
            <div>
              <h1 className="text-white font-bold text-sm md:text-base uppercase tracking-wider">
                LMS Laboratory
              </h1>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                ONLINE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-white text-xs font-bold uppercase">{user.role}</p>
              <p className="text-slate-400 text-[10px]">{user.username}</p>
            </div>
            <PixelButton variant="danger" onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut size={16} className="inline mr-1" />
              LOGOUT
            </PixelButton>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-0 left-0 h-screen bg-slate-800 border-r-4 border-slate-900 p-4 transition-transform z-40
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 w-64
          `}
        >
          <div className="mb-6 p-4 bg-slate-900 border-2 border-slate-700">
            <p className="text-xs text-slate-400 uppercase mb-1">Player</p>
            <p className="font-bold text-white">{user.name || user.username}</p>
            <p className="text-xs text-emerald-400 mt-1">Level 5 • {user.role}</p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = iconMap[item.icon] || Home;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase transition-colors
                    border-l-4
                    ${
                      isActive
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 p-4 bg-slate-900 border-2 border-slate-700 text-xs">
            <p className="text-slate-500 uppercase mb-2">System Status</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Database:</span>
                <span className="text-emerald-400">OK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Storage:</span>
                <span className="text-emerald-400">OK</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
