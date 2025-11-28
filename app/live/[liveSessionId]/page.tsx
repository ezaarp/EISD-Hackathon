import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLiveSession } from '@/app/actions/live-session';
import StudentLiveClient from './_components/StudentLiveClient';
import { prisma } from '@/lib/prisma';

export default async function StudentLivePage(props: { params: Promise<{ liveSessionId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PRAKTIKAN') {
    return redirect('/login');
  }

  // Verify access: Student must be in the shift
  const liveSession = await getLiveSession(params.liveSessionId);
  if (!liveSession) return <div>Session not found</div>;

  const assignment = await prisma.studentAssignment.findFirst({
    where: {
      shiftId: liveSession.shiftId,
      studentId: session.user.id,
    },
  });

  if (!assignment) {
    return <div>Access Denied: You are not assigned to this shift.</div>;
  }

  // Fetch submission if exists for Jurnal/Pretest/Posttest to restore state
  // TODO: Fetch submission state

  return (
    <div className="min-h-screen bg-slate-900 text-white font-mono pb-20">
       {/* Simple Header */}
       <header className="bg-slate-800 border-b-4 border-black p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="font-pixel text-emerald-400">
                {liveSession.shift.course.code}
            </div>
            <div className="text-sm">
                {liveSession.moduleWeek.title}
            </div>
        </div>
       </header>

       <main className="max-w-7xl mx-auto p-4 mt-4">
          <StudentLiveClient session={liveSession} liveSessionId={params.liveSessionId} userId={session.user.id} />
       </main>
    </div>
  );
}
