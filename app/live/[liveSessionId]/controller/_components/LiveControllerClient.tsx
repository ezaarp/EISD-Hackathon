'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PixelButton, PixelCard } from '@/components/ui';
import { Play, Square, SkipForward, SkipBack, Users, Clock, Presentation } from 'lucide-react';
import { StageType } from '@prisma/client';
import { startLiveSession, changeStage, endLiveSession, backStage } from '@/app/actions/live-session';
import PresentationViewer from '@/components/ui/PresentationViewer';
import { getFileUrl } from '@/lib/supabase';

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
  const [stageData, setStageData] = useState<any>(
    session.stages.length > 0 ? session.stages[session.stages.length - 1] : null
  );
  const [stageIndex, setStageIndex] = useState(session.currentStageIndex);
  const [status, setStatus] = useState(session.status);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const channel = supabase.channel(`live-${liveSessionId}`)
      .on('broadcast', { event: 'stage_change' }, (payload) => {
        console.log('Stage changed:', payload);
        setCurrentStage(payload.payload.stage);
        setStageIndex(payload.payload.index);
        setStageData({
          type: payload.payload.stage,
          startedAt: payload.payload.startedAt,
          durationSec: payload.payload.duration
        });
      })
      .on('broadcast', { event: 'session_start' }, (payload) => {
        setStatus('ACTIVE');
      })
      .on('broadcast', { event: 'session_end' }, (payload) => {
        setStatus('COMPLETED');
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'Attendance',
        filter: `liveSessionId=eq.${liveSessionId}` 
      }, (payload) => {
        setAttendanceCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveSessionId]);

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
    } catch (error) {
      console.error(error);
      alert('Failed to change stage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackStage = async () => {
    if (stageIndex <= 0) return;
    if (!confirm('Go back to previous stage? This will restart its timer.')) return;

    setIsLoading(true);
    try {
      await backStage(liveSessionId);
    } catch (error: any) {
      console.error(error);
      alert('Failed to go back: ' + error.message);
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

  // Timer Logic
  const endTime = stageData?.startedAt 
    ? new Date(new Date(stageData.startedAt).getTime() + stageData.durationSec * 1000) 
    : null;
  const isTimedStage = currentStage && ['PRETEST', 'JURNAL', 'POSTTEST'].includes(currentStage);
  const isReviewStage = currentStage && ['TP_REVIEW', 'JURNAL_REVIEW'].includes(currentStage);

  return (
    <div className="space-y-6">
      {/* Timer Bar - Shows across the top when in a timed stage */}
      {isTimedStage && endTime && (
        <div className="sticky top-20 z-40 bg-indigo-900/90 backdrop-blur border-b-4 border-indigo-500 p-4 flex justify-between items-center pixel-shadow">
          <div className="flex items-center gap-2">
            <Clock className="text-indigo-300 animate-pulse" />
            <span className="font-bold text-indigo-200">STAGE TIMER</span>
          </div>
          <div className="font-pixel text-3xl text-white">
            <Countdown target={endTime} />
          </div>
          <div className="text-xs text-indigo-300">
            {currentStage}
          </div>
        </div>
      )}

      {/* TP_REVIEW Presentation Controller */}
      {currentStage === 'TP_REVIEW' && session.tpReviewPresentationPath && (
        <PixelCard title="TP_REVIEW PRESENTATION CONTROLLER" color="bg-amber-900/50">
          <PresentationViewer 
            liveSessionId={liveSessionId}
            presentationUrl={getFileUrl('materials', session.tpReviewPresentationPath)}
            initialSlide={session.tpReviewCurrentSlide || 1}
            isController={true}
            presentationType="TP"
          />
          <p className="text-xs text-amber-300 mt-4 text-center">
            <Presentation size={14} className="inline mr-2" />
            Students will see the same TP slide in sync
          </p>
        </PixelCard>
      )}

      {/* JURNAL_REVIEW Presentation Controller */}
      {currentStage === 'JURNAL_REVIEW' && session.jurnalReviewPresentationPath && (
        <PixelCard title="JURNAL_REVIEW PRESENTATION CONTROLLER" color="bg-indigo-900/50">
          <PresentationViewer 
            liveSessionId={liveSessionId}
            presentationUrl={getFileUrl('materials', session.jurnalReviewPresentationPath)}
            initialSlide={session.jurnalReviewCurrentSlide || 1}
            isController={true}
            presentationType="JURNAL"
          />
          <p className="text-xs text-indigo-300 mt-4 text-center">
            <Presentation size={14} className="inline mr-2" />
            Students will see the same Jurnal slide in sync
          </p>
        </PixelCard>
      )}

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
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
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
                    variant="outline"
                    onClick={handleBackStage}
                    disabled={isLoading || status === 'COMPLETED' || stageIndex === 0}
                  >
                    <SkipBack size={20} className="mr-2" />
                    BACK
                  </PixelButton>

                  <PixelButton 
                    variant="warning"
                    onClick={handleNextStage}
                    disabled={isLoading || status === 'COMPLETED'}
                  >
                    <SkipForward size={20} className="mr-2" />
                    NEXT
                  </PixelButton>
                  
                  <PixelButton 
                    variant="danger"
                    onClick={handleEndSession}
                    disabled={isLoading || status === 'COMPLETED'}
                    className="col-span-2"
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
            <div className="text-center py-8">
              <Users size={48} className="mx-auto mb-4 text-emerald-400" />
              <div className="text-3xl font-pixel text-white mb-2">{attendanceCount}</div>
              <p className="text-sm text-slate-400">Students Present</p>
              <p className="text-xs text-slate-500 mt-2">Real-time updates active</p>
            </div>
          </PixelCard>
        </div>
      </div>
    </div>
  );
}

function Countdown({ target }: { target: Date }) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
      setLeft(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const m = Math.floor(left / 60);
  const s = left % 60;
  return <span>{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
}
