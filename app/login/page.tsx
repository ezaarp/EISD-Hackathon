'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Shield, Gamepad2, ArrowRight, KeyRound, Crown, Skull, Play, CornerDownLeft, CornerDownRight } from 'lucide-react';

type Mode = 'title' | 'menu' | 'praktikan' | 'asisten' | 'dosen';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('title');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleModeChange = (targetMode: Mode) => {
    if (mode === targetMode) return;
    setIsTransitioning(true);

    setTimeout(() => {
      setMode(targetMode);
      setUsername('');
      setPassword('');
      setError('');

      setTimeout(() => setIsTransitioning(false), 100);
    }, 400);
  };

  const handleStart = () => handleModeChange('menu');
  const handleBackToTitle = () => handleModeChange('title');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Ensure user selected a role-specific button
    if (!showLoginForm) {
      setLoading(false);
      setError('Silakan pilih tombol login terlebih dahulu');
      return;
    }

    const roleGate = mode === 'praktikan' || mode === 'asisten' || mode === 'dosen' ? mode : undefined;

    try {
      const result = await signIn('credentials', {
        username,
        password,
        roleGate,
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

  const showLoginForm = mode === 'praktikan' || mode === 'asisten' || mode === 'dosen';

  const EadLogo = () => (
    <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
      <path d="M40 10 L10 50 L40 90 L55 90 L25 50 L55 10 Z" fill="#22d3ee" className="drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
      <path d="M60 10 L90 50 L60 90 L45 90 L75 50 L45 10 Z" fill="#f472b6" className="drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center font-mono overflow-hidden relative selection:bg-red-500 selection:text-white">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 16, 32, 0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(18, 16, 32, 0.9) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundColor: '#020205',
        }}
      />

      <div
        className={`absolute w-[700px] h-[700px] blur-[100px] rounded-full z-0 transition-colors duration-1000 ${
          mode === 'dosen' ? 'bg-red-600/30' : mode === 'title' ? 'bg-blue-600/20' : 'bg-purple-600/20'
        }`}
      />

      <div className="relative z-10 flex flex-col items-center scale-90 md:scale-100 transition-transform duration-500">
        {/* HEADER */}
        <div
          className={`w-[380px] md:w-[500px] h-32 bg-gradient-to-b rounded-t-lg border-4 border-b-0 shadow-[0_0_20px_rgba(59,130,246,0.6)] flex flex-row items-center justify-between gap-2 relative overflow-hidden px-8 transition-colors duration-500 ${
            mode === 'dosen'
              ? 'from-red-950 to-slate-900 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.6)]'
              : 'from-slate-900 to-indigo-950 border-blue-500'
          }`}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />

          <div className="flex flex-col z-10 text-left">
            <h1
              className={`text-3xl md:text-4xl font-black italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] leading-none transition-colors duration-500 ${
                mode === 'dosen' ? 'text-red-100' : 'text-white'
              }`}
              style={{
                fontFamily: "'Press Start 2P', cursive",
                textShadow: mode === 'dosen' ? '4px 4px 0px #991b1b' : '4px 4px 0px #4f46e5',
              }}
            >
              PRACTICUM
            </h1>
            <h1
              className="text-4xl md:text-5xl font-black text-yellow-400 italic tracking-tighter drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] leading-none mt-2"
              style={{ fontFamily: "'Press Start 2P', cursive", textShadow: '4px 4px 0px #b45309' }}
            >
              TIME
            </h1>
          </div>

          <div
            className={`relative z-10 p-2 rounded-lg border backdrop-blur-sm transition-all duration-500 flex items-center justify-center ${
              mode === 'dosen' ? 'bg-red-900/20 border-red-500/30' : 'bg-blue-900/10 border-blue-500/20'
            }`}
          >
            <EadLogo />
          </div>

          <div
            className={`absolute bottom-1 w-full h-1 animate-pulse transition-colors duration-500 ${
              mode === 'dosen' ? 'bg-red-500' : mode === 'praktikan' ? 'bg-cyan-500' : mode === 'asisten' ? 'bg-pink-500' : 'bg-indigo-500'
            }`}
          />
        </div>

        {/* BODY */}
        <div
          className={`w-[420px] md:w-[560px] bg-indigo-950 border-x-8 border-t-8 rounded-t-3xl rounded-b-lg p-6 pb-12 shadow-2xl relative transition-colors duration-500 ${
            mode === 'dosen' ? 'border-red-900' : 'border-blue-600'
          }`}
        >
          <div className="bg-gray-800 p-5 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border-4 border-gray-700 relative">
            <div
              className={`relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border-2 shadow-[inset_0_0_40px_rgba(0,0,0,1)] transition-colors duration-300 ${
                mode === 'dosen' ? 'border-red-900' : 'border-gray-900'
              }`}
            >
              <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
              <div className="absolute inset-0 z-20 pointer-events-none animate-flicker opacity-10 bg-white mix-blend-overlay" />

              <div
                className={`w-full h-full relative z-10 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ease-in-out ${
                  isTransitioning ? 'scale-y-0 opacity-0 blur-md' : 'scale-y-100 opacity-100 blur-0'
                }`}
              >
                {mode === 'title' && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 cursor-pointer" onClick={handleStart}>
                    <div className="mb-10 animate-pulse">
                      <h2 className="text-blue-300 text-sm md:text-base font-bold tracking-widest mb-4" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                        WELCOME TO
                      </h2>
                      <h1
                        className="text-yellow-400 text-2xl md:text-3xl font-bold tracking-wider leading-relaxed drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                        style={{ fontFamily: "'Press Start 2P', cursive" }}
                      >
                        LMS
                        <br />
                        LABORATORY
                      </h1>
                    </div>

                    <div className="mt-8 animate-blink">
                      <div className="text-white text-xs md:text-sm bg-blue-600 px-4 py-2 rounded inline-flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.8)]">
                        <Play size={12} fill="currentColor" /> PRESS START
                      </div>
                    </div>

                    <div className="absolute bottom-4 text-[10px] text-gray-500 font-mono">© 2024 EAD LABS inc.</div>
                  </div>
                )}

                {mode === 'menu' && (
                  <div className="w-full h-full p-6 flex flex-col justify-between items-center relative overflow-hidden">
                    <div className="text-center mt-4 w-full">
                      <h2
                        className="text-white text-base md:text-lg font-bold tracking-widest uppercase mb-2 drop-shadow-md animate-pulse"
                        style={{ fontFamily: "'Press Start 2P', cursive" }}
                      >
                        SELECT CLASS
                      </h2>
                      <div className="h-0.5 w-1/2 bg-gray-600 mx-auto" />
                    </div>

                    <div className="flex-1 w-full flex items-center justify-between px-4 mt-4">
                      <div className="flex flex-col items-center animate-bounce gap-3">
                        <div className="text-cyan-400 font-bold text-xs uppercase tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">STUDENT</div>
                        <CornerDownLeft className="text-cyan-500 w-10 h-10" strokeWidth={3} />
                        <div className="text-[10px] text-cyan-300 bg-cyan-900/50 px-3 py-1 rounded border border-cyan-800">PUSH BLUE</div>
                      </div>

                      <div className="flex flex-col items-center animate-bounce gap-3" style={{ animationDelay: '0.1s' }}>
                        <div className="text-pink-400 font-bold text-xs uppercase tracking-widest drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]">ASSISTANT</div>
                        <CornerDownRight className="text-pink-500 w-10 h-10" strokeWidth={3} />
                        <div className="text-[10px] text-pink-300 bg-pink-900/50 px-3 py-1 rounded border border-pink-800">PUSH PINK</div>
                      </div>
                    </div>

                    <button
                      onClick={handleBackToTitle}
                      className="w-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-600 text-[10px] py-3 flex items-center justify-center gap-2 group transition-all rounded shadow-lg mb-2"
                    >
                      <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={14} />
                      <span>EXIT TO TITLE</span>
                    </button>
                  </div>
                )}

                {showLoginForm && (
                  <div className="w-full h-full flex flex-col px-6 py-4 overflow-hidden justify-center">
                    <div
                      className={`flex items-center justify-between mb-3 border-b-2 border-dashed pb-2 shrink-0 ${
                        mode === 'dosen' ? 'border-red-800' : 'border-gray-700'
                      }`}
                    >
                      <h2
                        className={`text-sm md:text-lg font-bold tracking-wider ${
                          mode === 'praktikan' ? 'text-cyan-400' : mode === 'asisten' ? 'text-pink-500' : 'text-red-500 glitch-text'
                        }`}
                        style={{ fontFamily: "'Press Start 2P', cursive" }}
                      >
                        {mode === 'praktikan' ? 'PLAYER 1' : mode === 'asisten' ? 'PLAYER 2' : 'GAME MASTER'}
                      </h2>
                      {mode === 'praktikan' && <User className="text-cyan-400 w-5 h-5" />}
                      {mode === 'asisten' && <Shield className="text-pink-500 w-5 h-5" />}
                      {mode === 'dosen' && <Crown className="text-red-500 w-5 h-5 animate-bounce" />}
                    </div>

                    <form className="space-y-3 flex-1 flex flex-col justify-center" onSubmit={handleSubmit}>
                      {mode === 'dosen' && (
                        <div className="bg-red-900/30 border border-red-600 p-1.5 mb-1 text-[9px] text-red-400 font-mono text-center shrink-0 tracking-wide">
                          WARNING: AUTHORIZED PERSONNEL ONLY
                        </div>
                      )}

                      {error && (
                        <div className="bg-rose-900/30 border border-rose-500 text-rose-200 text-xs px-3 py-2 font-bold tracking-wide">{error}</div>
                      )}

                      <div className="space-y-1 shrink-0">
                        <label className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">
                          {mode === 'dosen' ? 'ADMIN ID' : 'USERNAME'}
                        </label>
                        <div className="relative group">
                          <input
                            type="text"
                            className={`w-full bg-gray-900/90 border-2 px-3 py-2 text-xs md:text-sm outline-none font-mono rounded transition-colors ${
                              mode === 'praktikan'
                                ? 'border-cyan-800 focus:border-cyan-400 text-cyan-300'
                                : mode === 'asisten'
                                ? 'border-pink-800 focus:border-pink-400 text-pink-300'
                                : 'border-red-800 focus:border-red-500 text-red-300'
                            }`}
                            placeholder={mode === 'dosen' ? 'ROOT ACCESS...' : 'ENTER ID...'}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                          />
                          <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                        </div>
                      </div>

                      <div className="space-y-1 shrink-0">
                        <label className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">PASSWORD</label>
                        <div className="relative group">
                          <input
                            type="password"
                            className={`w-full bg-gray-900/90 border-2 px-3 py-2 text-xs md:text-sm outline-none font-mono rounded transition-colors ${
                              mode === 'praktikan'
                                ? 'border-cyan-800 focus:border-cyan-400 text-cyan-300'
                                : mode === 'asisten'
                                ? 'border-pink-800 focus:border-pink-400 text-pink-300'
                                : 'border-red-800 focus:border-red-500 text-red-300'
                            }`}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                          />
                          <Gamepad2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                        </div>
                      </div>

                      <button
                        className={`w-full mt-3 py-3 text-xs md:text-sm font-bold uppercase tracking-widest transition-all transform active:scale-95 shrink-0 ${
                          mode === 'praktikan'
                            ? 'bg-cyan-700 hover:bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]'
                            : mode === 'asisten'
                            ? 'bg-pink-700 hover:bg-pink-600 text-white shadow-[0_0_10px_rgba(219,39,119,0.5)]'
                            : 'bg-red-700 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.8)] border border-red-500'
                        }`}
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'PROCESSING...' : mode === 'dosen' ? 'OVERRIDE SYSTEM' : 'INSERT COIN (LOGIN)'}
                      </button>

                      <p className="text-[10px] text-center text-gray-500 pt-3 border-t border-gray-800">
                        Default password Praktikan: NIM • Hubungi admin jika lupa password
                      </p>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-black/40 p-4 rounded-lg border-t border-white/10 relative">
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gray-600 flex items-center justify-center">
              <div className="w-1 h-0.5 bg-gray-800 rotate-45" />
            </div>
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-600 flex items-center justify-center">
              <div className="w-1 h-0.5 bg-gray-800 rotate-45" />
            </div>

            <div className="flex justify-between items-end px-4 md:px-6">
              <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => handleModeChange('dosen')}>
                <div className="relative">
                  <div className="w-16 h-16 rounded bg-gray-800 border-2 border-gray-600 shadow-lg flex items-center justify-center transform group-active:translate-y-1 transition-transform">
                    <div
                      className={`w-12 h-12 rounded-full border-4 ${
                        mode === 'dosen' ? 'bg-red-600 border-red-400 shadow-[0_0_25px_rgba(220,38,38,1)] animate-pulse' : 'bg-red-800 border-red-900 group-hover:bg-red-700'
                      } flex items-center justify-center transition-all`}
                    >
                      <Skull size={20} className={`text-red-950 ${mode === 'dosen' ? 'animate-spin-slow' : ''}`} />
                    </div>
                  </div>
                </div>
                <div className="text-[9px] text-red-500/70 font-bold uppercase tracking-widest text-center">DOSEN</div>
              </div>

              {mode === 'title' ? (
                <div className="h-16 w-32 flex items-center justify-center">
                  <div className="text-[9px] text-gray-600 font-mono animate-pulse">INSERT COIN</div>
                </div>
              ) : (
                <div className="flex gap-6 md:gap-8">
                  <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => handleModeChange('praktikan')}>
                    <div
                      className={`w-14 h-14 rounded-full border-b-4 transition-all active:border-b-0 active:translate-y-1 ${
                        mode === 'praktikan' ? 'bg-cyan-400 border-cyan-700 shadow-[0_0_20px_rgba(34,211,238,0.8)]' : 'bg-cyan-600 border-cyan-800 hover:bg-cyan-500'
                      }`}
                    />
                    <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">Student</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => handleModeChange('asisten')}>
                    <div
                      className={`w-14 h-14 rounded-full border-b-4 transition-all active:border-b-0 active:translate-y-1 ${
                        mode === 'asisten' ? 'bg-pink-500 border-pink-700 shadow-[0_0_20px_rgba(236,72,153,0.8)]' : 'bg-pink-700 border-pink-900 hover:bg-pink-600'
                      }`}
                    />
                    <span className="text-[10px] text-pink-300 font-bold uppercase tracking-wider">Assistant</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-6 left-6 flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-1 h-8 bg-black/50 rounded-full" />
            ))}
          </div>
          <div className="absolute bottom-6 right-6 flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-1 h-8 bg-black/50 rounded-full" />
            ))}
          </div>
        </div>

        <div className="w-[460px] md:w-[600px] h-24 bg-indigo-900 clip-path-trapezoid mt-[-10px] -z-10 flex items-center justify-center border-t-4 border-blue-800 shadow-2xl">
          <div className="flex gap-12 opacity-50">
            <div className="w-14 h-20 bg-black border-2 border-gray-700 rounded mb-4 flex items-center justify-center relative">
              <div className="w-1 h-10 bg-yellow-600/50" />
              <div className="absolute -bottom-2 text-[8px] text-yellow-600 font-bold">25¢</div>
            </div>
            <div className="w-14 h-20 bg-black border-2 border-gray-700 rounded mb-4 flex items-center justify-center relative">
              <div className="w-1 h-10 bg-yellow-600/50" />
              <div className="absolute -bottom-2 text-[8px] text-yellow-600 font-bold">25¢</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        .clip-path-trapezoid {
          clip-path: polygon(10% 0, 90% 0, 100% 100%, 0% 100%);
        }

        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }

        .animate-blink {
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          50% {
            opacity: 0;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes flicker {
          0% {
            opacity: 0.1;
          }
          5% {
            opacity: 0.2;
          }
          10% {
            opacity: 0.1;
          }
          15% {
            opacity: 0.3;
          }
          20% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.1;
          }
          55% {
            opacity: 0.2;
          }
          60% {
            opacity: 0.05;
          }
          100% {
            opacity: 0.1;
          }
        }

        .animate-flicker {
          animation: flicker 0.15s infinite;
        }

        .glitch-text {
          animation: glitch 1s infinite;
        }

        @keyframes glitch {
          0% {
            transform: translate(0);
          }
          20% {
            transform: translate(-2px, 2px);
          }
          40% {
            transform: translate(-2px, -2px);
          }
          60% {
            transform: translate(2px, 2px);
          }
          80% {
            transform: translate(2px, -2px);
          }
          100% {
            transform: translate(0);
          }
        }
      `}</style>
    </div>
  );
}
