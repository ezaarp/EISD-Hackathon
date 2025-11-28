'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PixelCard, PixelButton, Timer } from '@/components/ui'; 
import { StageType } from '@prisma/client';
import { Clock, AlertCircle, CheckCircle, FileText, Save, Users, Upload, X } from 'lucide-react';
import { submitMCQ, submitCode, uploadEvidence } from '@/app/actions/submission';

export default function StudentLiveClient({ session, liveSessionId, userId }: { session: any, liveSessionId: string, userId: string }) {
  const [currentStage, setCurrentStage] = useState<StageType | null>(
    session.stages.length > 0 ? session.stages[session.stages.length - 1].type : null
  );
  const [stageData, setStageData] = useState<any>(
    session.stages.length > 0 ? session.stages[session.stages.length - 1] : null
  );
  const [status, setStatus] = useState(session.status);
  
  // Submission State
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [codeAnswer, setCodeAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAutosave, setLastAutosave] = useState<Date | null>(null);
  
  // Evidence Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const channel = supabase.channel(`live-${liveSessionId}`)
      .on('broadcast', { event: 'stage_change' }, (payload) => {
        console.log('Stage Update:', payload);
        setCurrentStage(payload.payload.stage);
        setStageData({
            type: payload.payload.stage,
            startedAt: payload.payload.startedAt,
            durationSec: payload.payload.duration
        });
        // Reset state on stage change
        setMcqAnswers({});
        setCodeAnswer('');
        setLastAutosave(null);
      })
      .on('broadcast', { event: 'session_end' }, (payload) => {
        setStatus('COMPLETED');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveSessionId]);

  // Autosave for Code
  useEffect(() => {
      if (currentStage !== 'JURNAL' || !codeAnswer) return;

      const timeout = setTimeout(async () => {
          try {
            // Retrieve current task ID for Jurnal
            const task = session.moduleWeek.tasks.find((t: any) => t.type === 'JURNAL');
            const question = task?.questions[0];
            if (task && question) {
                await fetch('/api/autosave', {
                    method: 'POST',
                    body: JSON.stringify({
                        taskId: task.id,
                        questionId: question.id,
                        code: codeAnswer,
                        liveSessionId
                    })
                });
                setLastAutosave(new Date());
            }
          } catch (e) {
              console.error("Autosave failed", e);
          }
      }, 2000); // Debounce 2s

      return () => clearTimeout(timeout);
  }, [codeAnswer, currentStage, session.moduleWeek.tasks, liveSessionId]);

  const handleMCQSubmit = async (taskId: string) => {
      if (!confirm('Submit answers? You cannot change them after submitting.')) return;
      setIsSubmitting(true);
      try {
          await submitMCQ(taskId, mcqAnswers, liveSessionId);
          alert('Answers submitted successfully!');
      } catch (e) {
          alert('Failed to submit');
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleCodeSubmit = async (taskId: string, questionId: string) => {
       if (!confirm('Submit code? Ensure you have tested it.')) return;
       setIsSubmitting(true);
       try {
           await submitCode(taskId, questionId, codeAnswer, liveSessionId);
           alert('Code submitted successfully!');
       } catch (e) {
           alert('Failed to submit');
       } finally {
           setIsSubmitting(false);
       }
  };

  const handleUploadEvidence = async (formData: FormData) => {
      setIsUploading(true);
      try {
          await uploadEvidence(formData);
          alert('Evidence uploaded successfully!');
          setShowUploadModal(false);
      } catch (e: any) {
          alert('Failed to upload evidence: ' + e.message);
      } finally {
          setIsUploading(false);
      }
  };

  if (status === 'COMPLETED') {
    return (
        <PixelCard className="text-center py-20">
            <h1 className="text-3xl font-pixel text-emerald-400 mb-4">SESSION COMPLETED</h1>
            <p>Thank you for attending today's practical session.</p>
            <PixelButton href="/dashboard/praktikan" variant="primary" className="mt-8 inline-block">
                Back to Dashboard
            </PixelButton>
        </PixelCard>
    );
  }

  if (!currentStage || currentStage === 'OPENING') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="animate-pulse">
                <h1 className="text-4xl font-pixel text-white text-center mb-4">WAITING FOR SESSION TO START</h1>
                <p className="text-slate-400 text-center">Please wait for the assistant/publication to start the session.</p>
            </div>
            <div className="w-16 h-16 border-4 border-t-emerald-400 border-slate-700 rounded-full animate-spin"></div>
        </div>
    );
  }

  // Helper to find tasks
  const pretestTask = session.moduleWeek.tasks.find((t: any) => t.type === 'PRETEST');
  const jurnalTask = session.moduleWeek.tasks.find((t: any) => t.type === 'JURNAL');
  const posttestTask = session.moduleWeek.tasks.find((t: any) => t.type === 'POSTTEST');

  // Timer Logic
  const endTime = stageData?.startedAt 
    ? new Date(new Date(stageData.startedAt).getTime() + stageData.durationSec * 1000) 
    : null;
    
  const isTimedStage = ['PRETEST', 'JURNAL', 'POSTTEST'].includes(currentStage);

  return (
    <div className="space-y-6">
        {/* Timer Bar */}
        {isTimedStage && endTime && (
             <div className="sticky top-20 z-40 bg-slate-900/90 backdrop-blur border-b-4 border-rose-500 p-4 flex justify-between items-center mb-8 pixel-shadow">
                <div className="flex items-center gap-2">
                    <Clock className="text-rose-500 animate-pulse" />
                    <span className="font-bold text-rose-500">TIME REMAINING</span>
                </div>
                <div className="font-pixel text-2xl text-white">
                    <Countdown target={endTime} />
                </div>
            </div>
        )}

        {currentStage === 'PRETEST' && pretestTask && (
             <div className="space-y-6">
                <PixelCard title={`PRE-TEST: ${pretestTask.title}`}>
                    <p className="mb-4 text-slate-300" dangerouslySetInnerHTML={{__html: pretestTask.instructions}} />
                    
                    <div className="space-y-6">
                        {pretestTask.questions.map((q: any, idx: number) => (
                            <div key={q.id} className="p-4 border-2 border-slate-700 bg-slate-800">
                                <p className="font-bold mb-4">{idx + 1}. {q.prompt}</p>
                                <div className="space-y-2">
                                    {q.optionsJson && JSON.parse(q.optionsJson).map((opt: string, optIdx: number) => (
                                        <div 
                                            key={optIdx} 
                                            onClick={() => setMcqAnswers(prev => ({...prev, [q.id]: optIdx.toString()}))}
                                            className={`p-3 border cursor-pointer transition-colors ${
                                                mcqAnswers[q.id] === optIdx.toString() 
                                                ? 'bg-indigo-600 border-indigo-400 text-white' 
                                                : 'border-slate-600 hover:bg-slate-700 text-slate-300'
                                            }`}
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <PixelButton 
                            variant="primary" 
                            className="w-full" 
                            onClick={() => handleMCQSubmit(pretestTask.id)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT PRE-TEST'}
                        </PixelButton>
                    </div>
                </PixelCard>
             </div>
        )}

        {currentStage === 'JURNAL' && jurnalTask && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {jurnalTask.questions.map((q: any, idx: number) => (
                        <PixelCard key={q.id} title={`TASK ${idx + 1}`}>
                             <div className="prose prose-invert max-w-none mb-4">
                                <p className="font-bold text-emerald-400">{q.prompt}</p>
                                {q.constraints && <pre className="text-xs text-slate-500 mt-2">{q.constraints}</pre>}
                             </div>
                             
                             <div className="mt-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold uppercase text-slate-400">Your Code</label>
                                    {lastAutosave && (
                                        <span className="text-xs text-emerald-500 flex items-center gap-1">
                                            <Save size={12} /> Autosaved {lastAutosave.toLocaleTimeString()}
                                        </span>
                                    )}
                                </div>
                                <textarea 
                                    className="w-full h-96 bg-slate-950 border-2 border-slate-700 p-4 font-mono text-sm text-emerald-400 focus:border-emerald-500 outline-none"
                                    placeholder="// Type your code here..."
                                    value={codeAnswer}
                                    onChange={(e) => setCodeAnswer(e.target.value)}
                                ></textarea>
                                <div className="mt-4">
                                    <PixelButton 
                                        variant="success" 
                                        className="w-full"
                                        onClick={() => handleCodeSubmit(jurnalTask.id, q.id)}
                                        disabled={isSubmitting}
                                    >
                                        SUBMIT CODE ANSWER
                                    </PixelButton>
                                </div>
                             </div>
                        </PixelCard>
                    ))}
                </div>
                <div className="space-y-6">
                    <PixelCard title="INSTRUCTIONS">
                        <div className="prose prose-invert text-sm" dangerouslySetInnerHTML={{__html: jurnalTask.instructions}} />
                        <div className="mt-4 p-4 bg-slate-800 border border-slate-600">
                            <p className="text-xs text-slate-400 mb-2">Don't forget to upload evidence PDF.</p>
                            <PixelButton 
                                variant="outline" 
                                className="w-full text-xs"
                                onClick={() => setShowUploadModal(true)}
                            >
                                <Upload size={14} className="mr-2" />
                                UPLOAD EVIDENCE
                            </PixelButton>
                        </div>
                    </PixelCard>
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border-2 border-slate-600 w-full max-w-md p-6 relative">
                            <button 
                                onClick={() => setShowUploadModal(false)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                            <h3 className="text-xl font-pixel text-white mb-4">UPLOAD EVIDENCE</h3>
                            <form action={handleUploadEvidence} className="space-y-4">
                                <input type="hidden" name="taskId" value={jurnalTask.id} />
                                <input type="hidden" name="liveSessionId" value={liveSessionId} />
                                
                                <div>
                                    <label className="block text-xs text-slate-400 mb-2 uppercase">Select PDF File</label>
                                    <input 
                                        type="file" 
                                        name="file" 
                                        accept=".pdf"
                                        className="w-full bg-black border border-slate-700 p-2 text-sm" 
                                        required 
                                    />
                                </div>
                                
                                <div className="pt-4">
                                    <PixelButton 
                                        type="submit" 
                                        variant="primary" 
                                        className="w-full"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? 'UPLOADING...' : 'UPLOAD PDF'}
                                    </PixelButton>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
             </div>
        )}

        {currentStage === 'POSTTEST' && posttestTask && (
            <div className="space-y-6">
                <PixelCard title={`POST-TEST: ${posttestTask.title}`}>
                     <p className="mb-4 text-slate-300" dangerouslySetInnerHTML={{__html: posttestTask.instructions}} />
                     {/* Same MCQ Render Logic */}
                     <div className="space-y-6">
                        {posttestTask.questions.map((q: any, idx: number) => (
                            <div key={q.id} className="p-4 border-2 border-slate-700 bg-slate-800">
                                <p className="font-bold mb-4">{idx + 1}. {q.prompt}</p>
                                <div className="space-y-2">
                                    {q.optionsJson && JSON.parse(q.optionsJson).map((opt: string, optIdx: number) => (
                                        <div 
                                            key={optIdx} 
                                            onClick={() => setMcqAnswers(prev => ({...prev, [q.id]: optIdx.toString()}))}
                                            className={`p-3 border cursor-pointer transition-colors ${
                                                mcqAnswers[q.id] === optIdx.toString() 
                                                ? 'bg-indigo-600 border-indigo-400 text-white' 
                                                : 'border-slate-600 hover:bg-slate-700 text-slate-300'
                                            }`}
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <PixelButton 
                            variant="primary" 
                            className="w-full" 
                            onClick={() => handleMCQSubmit(posttestTask.id)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT POST-TEST'}
                        </PixelButton>
                    </div>
                </PixelCard>
            </div>
        )}

        {currentStage === 'FEEDBACK' && (
            <PixelCard title="FEEDBACK" className="max-w-2xl mx-auto">
                <div className="text-center space-y-6">
                    <h2 className="text-xl">Rate this Session</h2>
                    <div className="flex justify-center gap-2">
                        {[1,2,3,4,5].map(star => (
                            <button key={star} className="text-3xl hover:scale-125 transition-transform">⭐</button>
                        ))}
                    </div>
                    <textarea className="w-full bg-slate-800 border border-slate-600 p-3" placeholder="Any comments?"></textarea>
                    <PixelButton variant="primary">SEND FEEDBACK</PixelButton>
                </div>
            </PixelCard>
        )}
    </div>
  );
}

function UsersIcon(props: any) {
    return <Users size={24} {...props} />;
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
