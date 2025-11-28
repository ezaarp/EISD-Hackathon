import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12 animate-pulse">
        <h1 className="text-4xl md:text-6xl text-emerald-400 font-pixel mb-4 pixel-outline">
          PIXEL LMS
        </h1>
        <p className="text-indigo-400 text-sm md:text-xl uppercase tracking-widest font-pixel">
          Laboratory System
        </p>
      </div>

      <div className="pixel-card bg-slate-800 max-w-md w-full">
        <div className="absolute -top-5 left-2 bg-black text-white px-2 py-1 text-xs font-bold border-2 border-white">
          SYSTEM STATUS
        </div>

        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Database:</span>
            <span className="text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              ONLINE
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Version:</span>
            <span className="text-white">2.5 (PIXEL UPDATE)</span>
          </div>

          <div className="border-t-2 border-slate-700 pt-4 mt-4">
            <Link
              href="/login"
              className="block w-full text-center pixel-btn bg-indigo-500 hover:bg-indigo-400 text-white"
            >
              LOGIN TO SYSTEM
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 text-slate-600 text-xs text-center max-w-md font-mono">
        <p>TELKOM UNIVERSITY</p>
        <p>LABORATORY MANAGEMENT SYSTEM v2.5</p>
        <p className="mt-2 text-[10px]">Powered by Next.js 14 + Supabase + Prisma</p>
      </div>
    </div>
  );
}
