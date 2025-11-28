'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PixelButton, PixelCard, Timer, StatusBar } from '@/components/ui';
import { Play, Pause, Square, SkipForward, Users, AlertTriangle } from 'lucide-react';
import { StageType } from '@prisma/client';
import { startLiveSession, changeStage, endLiveSession } from '@/app/actions/live-session';

const STAGES: StageType[] = [
  'OPENING',
  'ABSEN',
  'PRETEST',
  'TP_REVIEW',
  'JURNAL_REVIEW',
  'JURNAL',
  'POSTTEST',
  'FEEDBACK'
];

const STAGE_DURATIONS: Record<StageType, number> = {
  OPENING: 300, // 5 min
  ABSEN: 300,   // 5 min
  PRETEST: 600, // 10 min
  TP_REVIEW: 900, // 15 min
  JURNAL_REVIEW: 900, // 15 min
  JURNAL: 5400, // 90 min
  POSTTEST: 600, // 10 min
  FEEDBACK: 300, // 5 min
};

export default function LiveControllerClient({ session, liveSessionId }: { session: any, liveSessionId: string }) {
  const [currentStage, setCurrentStage] = useState<StageType | null>(
    session.stages.length > 0 ? session.stages[session.stages.length - 1].type : null
  );
  const [stageIndex, setStageIndex] = useState(session.currentStageIndex);
  const [status, setStatus] = useState(session.status);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const channel = supabase.channel(`live-${liveSessionId}`)
      .on('broadcast', { event: 'stage_change' }, (payload) => {
        console.log('Stage changed:', payload);
        setCurrentStage(payload.payload.stage);
        setStageIndex(payload.payload.index);
      })
      .on('broadcast', { event: 'session_start' }, (payload) => {
        setStatus('ACTIVE');
      })
      .on('broadcast', { event: 'session_end' }, (payload) => {
        setStatus('COMPLETED');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveSessionId, supabase]);

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      await startLiveSession(liveSessionId);
      setStatus('ACTIVE');
      setCurrentStage('OPENING');
      setStageIndex(0);
    } catch (error) {
      console.error(error);
      alert('Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStage = async () => {
    if (stageIndex >= STAGES.length - 1) return;
    
    const nextStage = STAGES[stageIndex + 1];
    const duration = STAGE_DURATIONS[nextStage];
    
    if (!confirm(`Move to next stage: ${nextStage}?`)) return;

    setIsLoading(true);
    try {
      await changeStage(liveSessionId, nextStage, duration);
      // State update handled by realtime subscription or optimistic update
    } catch (error) {
      console.error(error);
      alert('Failed to change stage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to END the session?')) return;
    
    setIsLoading(true);
    try {
      await endLiveSession(liveSessionId);
      router.push('/dashboard/publikasi/live-session');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Control Panel */}
      <div className="lg:col-span-2 space-y-6">
        <PixelCard title="SESSION CONTROLS" color="bg-slate-800">
          <div className="flex flex-col items-center justify-center p-6 space-y-8">
            
            {/* Status Display */}
            <div className="text-center space-y-2">
              <p className="text-slate-400 text-sm uppercase tracking-widest">Current Status</p>
              <div className={`text-4xl font-pixel ${status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-500'}`}>
                {status}
              </div>
              {currentStage && (
                <div className="bg-indigo-900 border-2 border-indigo-500 px-6 py-2 mt-4 inline-block">
                  <p className="text-indigo-300 text-xs mb-1">CURRENT STAGE</p>
                  <p className="text-2xl text-white font-bold">{currentStage}</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {status === 'DRAFT' ? (
                <PixelButton 
                  variant="success" 
                  className="col-span-2 py-4 text-lg"
                  onClick={handleStartSession}
                  disabled={isLoading}
                >
                  <Play size={24} className="mr-2" />
                  START SESSION
                </PixelButton>
              ) : (
                <>
                  <PixelButton 
                    variant="warning"
                    onClick={handleNextStage}
                    disabled={isLoading || status === 'COMPLETED'}
                  >
                    <SkipForward size={20} className="mr-2" />
                    NEXT STAGE
                  </PixelButton>
                  
                  <PixelButton 
                    variant="danger"
                    onClick={handleEndSession}
                    disabled={isLoading || status === 'COMPLETED'}
                  >
                    <Square size={20} className="mr-2" />
                    END SESSION
                  </PixelButton>
                </>
              )}
            </div>

            {/* Stage Progress */}
            <div className="w-full pt-6 border-t-2 border-slate-700">
              <p className="text-xs text-slate-400 mb-4 text-center">SESSION PROGRESS</p>
              <div className="flex justify-between items-center relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-700 -z-10" />
                {STAGES.map((stage, idx) => (
                  <div 
                    key={stage}
                    className={`flex flex-col items-center gap-2 ${
                      idx === stageIndex ? 'scale-110' : 
                      idx < stageIndex ? 'opacity-50' : 'opacity-30'
                    }`}
                  >
                    <div className={`w-4 h-4 border-2 ${
                      idx === stageIndex ? 'bg-emerald-400 border-emerald-600' : 
                      idx < stageIndex ? 'bg-indigo-500 border-indigo-700' : 'bg-slate-800 border-slate-600'
                    }`} />
                    <span className="text-[10px] font-bold hidden md:block">{stage}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </PixelCard>
      </div>

      {/* Sidebar Stats */}
      <div className="space-y-6">
        <PixelCard title="SESSION INFO">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400">Module</span>
              <span className="font-bold text-white">{session.moduleWeek.title}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400">Shift</span>
              <span className="font-bold text-white">{session.shift.name}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400">Room</span>
              <span className="font-bold text-white">{session.shift.room}</span>
            </div>
          </div>
        </PixelCard>

        <PixelCard title="ATTENDANCE" color="bg-slate-800">
           <div className="text-center py-8 text-slate-500">
             <Users size={32} className="mx-auto mb-2" />
             <p>0 / 0 Present</p>
             <p className="text-xs mt-2">Real-time attendance coming soon</p>
           </div>
        </PixelCard>
      </div>
    </div>
  );
}

