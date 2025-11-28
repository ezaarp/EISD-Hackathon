'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PixelButton, PixelCard } from '@/components/ui';
import { Terminal, Users, Award, ShieldAlert, FileText, Radio, Camera, FlaskConical, GraduationCap } from 'lucide-react';

const ROLE_ICONS: Record<string, any> = {
  PRAKTIKAN: Users,
  ASISTEN: Award,
  KOORDINATOR: GraduationCap,
  SEKRETARIS: FileText,
  KOMDIS: ShieldAlert,
  PUBLIKASI: Radio,
  MEDIA: Camera,
  LABORAN: FlaskConical,
  DOSEN: GraduationCap,
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-12 animate-pulse">
        <h1 className="text-4xl md:text-6xl text-emerald-400 font-pixel mb-4 pixel-outline">
          PIXEL LMS
        </h1>
        <p className="text-indigo-400 text-sm md:text-xl uppercase tracking-widest font-pixel">
          Laboratory System
        </p>
      </div>

      {/* Login Form */}
      <PixelCard className="max-w-md w-full mb-8" color="bg-slate-800">
        <div className="absolute -top-5 left-2 bg-black text-white px-2 py-1 text-xs font-bold border-2 border-white">
          SYSTEM LOGIN
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="bg-rose-500/20 border-2 border-rose-500 p-3 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-400 text-xs uppercase font-bold mb-2">
              Username (NIM / Kode Asprak)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border-2 border-slate-700 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none font-mono"
              placeholder="1202204111"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border-2 border-slate-700 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none font-mono"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <PixelButton
            type="submit"
            variant="success"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </PixelButton>
        </form>

        <div className="mt-4 text-xs text-slate-500 text-center border-t-2 border-slate-700 pt-4">
          <p>Default Password: NIM (untuk Praktikan)</p>
          <p>Hubungi admin jika lupa password</p>
        </div>
      </PixelCard>

      {/* Role Info */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl w-full">
        {Object.entries(ROLE_ICONS).map(([role, Icon]) => (
          <div
            key={role}
            className="bg-slate-800/50 border-2 border-slate-700 p-3 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity"
          >
            <Icon className="w-6 h-6 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {role}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 text-slate-600 text-xs text-center max-w-md font-mono">
        <p>TELKOM UNIVERSITY - LABORATORY MANAGEMENT SYSTEM</p>
        <p className="mt-2">VERSION: 2.5 (PIXEL UPDATE)</p>
      </div>
    </div>
  );
}
