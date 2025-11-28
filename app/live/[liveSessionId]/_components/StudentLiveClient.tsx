'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PixelCard, PixelButton } from '@/components/ui'; 
import { StageType } from '@prisma/client';
import { Clock, AlertCircle, CheckCircle, FileText, Save, Users, Upload, X, Hand, Presentation } from 'lucide-react';
import { submitMCQ, submitCode, uploadEvidence } from '@/app/actions/submission';
import PresentationViewer from '@/components/ui/PresentationViewer';
import { getFileUrl } from '@/lib/supabase';

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

  // Quiz Result State
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizResult, setQuizResult] = useState<{score: number, total: number, timeRemaining: string} | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackThankYou, setShowFeedbackThankYou] = useState(false);

  // Attendance State
  const [attendanceMarked, setAttendanceMarked] = useState(false);

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
        setShowQuizResult(false);
        setQuizResult(null);
        setHasSubmitted(false);
      })
      .on('broadcast', { event: 'session_end' }, (payload) => {
        setStatus('COMPLETED');
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'Attendance',
        filter: `studentId=eq.${userId}` 
      }, (payload) => {
        console.log('Attendance marked:', payload);
        setAttendanceMarked(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveSessionId, userId]);

  // Autosave for Code
  useEffect(() => {
      if (currentStage !== 'JURNAL' || !codeAnswer) return;

      const timeout = setTimeout(async () => {
          try {
            const task = session.moduleWeek.tasks.find((t: any) => t.type.toUpperCase() === 'JURNAL');
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
      }, 2000);

      return () => clearTimeout(timeout);
  }, [codeAnswer, currentStage, session.moduleWeek.tasks, liveSessionId]);

  const handleMCQSubmit = async (taskId: string, taskType: string) => {
      if (!confirm('Submit answers? You cannot change them after submitting.')) return;
      setIsSubmitting(true);
      try {
          const result = await submitMCQ(taskId, mcqAnswers, liveSessionId);
          
          // Calculate time remaining
          const now = new Date();
          const endTime = stageData?.startedAt 
            ? new Date(new Date(stageData.startedAt).getTime() + stageData.durationSec * 1000) 
            : now;
          const timeLeft = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;
          
          // Lock submission
          setHasSubmitted(true);
          
          // Show result modal
          setQuizResult({
            score: result.score || 0,
            total: result.total || 0,
            timeRemaining: `${minutes}:${seconds.toString().padStart(2, '0')}`
          });
          setShowQuizResult(true);
      } catch (e: any) {
          alert('Failed to submit: ' + e.message);
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

  const handleFeedbackSubmit = async () => {
      if (feedbackRating === 0) {
        alert('Please select a rating');
        return;
      }
      
      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            liveSessionId,
            rating: feedbackRating,
            comment: feedbackComment,
            type: 'PRAKTIKUM'
          })
        });
        
        if (!response.ok) throw new Error('Failed to submit feedback');
        
        setShowFeedbackThankYou(true);
        setTimeout(() => {
          setShowFeedbackThankYou(false);
        }, 3000);
      } catch (e: any) {
        alert('Failed to submit feedback: ' + e.message);
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
  const pretestTask = session.moduleWeek.tasks.find((t: any) => t.type.toUpperCase() === 'PRETEST');
  const jurnalTask = session.moduleWeek.tasks.find((t: any) => t.type.toUpperCase() === 'JURNAL');
  const posttestTask = session.moduleWeek.tasks.find((t: any) => t.type.toUpperCase() === 'POSTTEST');

  // Timer Logic
  const endTime = stageData?.startedAt 
    ? new Date(new Date(stageData.startedAt).getTime() + stageData.durationSec * 1000) 
    : null;
    
  const isTimedStage = ['PRETEST', 'JURNAL', 'POSTTEST'].includes(currentStage);

  return (
    <div className="space-y-6">
        {/* Timer Bar - Visible to all during timed stages */}
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

        {/* ABSEN STAGE - Show raise hand message */}
        {currentStage === 'ABSEN' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                <div className={`text-center transition-all duration-500 ${attendanceMarked ? 'scale-110' : ''}`}>
                    <div className="mb-8">
                        <Hand size={80} className={`mx-auto ${attendanceMarked ? 'text-emerald-400' : 'text-amber-400 animate-bounce'}`} />
                    </div>
                    {!attendanceMarked ? (
                        <>
                            <h1 className="text-4xl font-pixel text-white mb-4">ATTENDANCE CHECK</h1>
                            <p className="text-xl text-amber-400 mb-2">Ketika Nama dipanggil,</p>
                            <p className="text-2xl font-bold text-amber-300">tolong angkat tangan! 🙋‍♂️</p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-4xl font-pixel text-emerald-400 mb-4">ATTENDANCE MARKED ✓</h1>
                            <p className="text-xl text-emerald-300">Your attendance has been recorded</p>
                        </>
                    )}
                </div>
            </div>
        )}

        {/* Quiz Result Modal - LOCKED, cannot close */}
        {showQuizResult && quizResult && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border-4 border-emerald-500 w-full max-w-lg p-8 relative text-center">
                    <CheckCircle size={64} className="mx-auto text-emerald-400 mb-4" />
                    <h2 className="text-3xl font-pixel text-emerald-400 mb-4">SELAMAT!</h2>
                    <p className="text-xl text-white mb-6">Telah berhasil menyelesaikan quiz</p>
                    
                    <div className="bg-slate-800 border-2 border-slate-700 p-6 mb-6">
                        <div className="text-4xl font-pixel text-white mb-2">
                            {quizResult.score} / {quizResult.total}
                        </div>
                        <p className="text-slate-400">Your Score</p>
                    </div>
                    
                    <div className="text-sm text-slate-400 mb-6">
                        <Clock size={16} className="inline mr-2" />
                        Time Remaining: <span className="text-emerald-400 font-bold">{quizResult.timeRemaining}</span>
                    </div>
                    
                    <p className="text-xs text-slate-500">Mohon tunggu asisten untuk melanjutkan ke stage berikutnya</p>
                </div>
            </div>
        )}

        {/* TP_REVIEW - Material Review with Presentation */}
        {currentStage === 'TP_REVIEW' && (
            <div className="space-y-6">
                <div className="bg-amber-900/50 border-2 border-amber-500 p-6 text-center">
                    <Presentation size={48} className="mx-auto text-amber-400 mb-4" />
                    <h1 className="text-3xl font-pixel text-white mb-2">PEMBAHASAN MATERI</h1>
                    <p className="text-amber-300">Perhatikan materi yang disampaikan oleh Asisten Praktikum</p>
                </div>

                {session.tpReviewPresentationPath ? (
                    <PixelCard title="TP PRESENTATION">
                        <PresentationViewer 
                            liveSessionId={liveSessionId}
                            presentationUrl={getFileUrl('materials', session.tpReviewPresentationPath)}
                            initialSlide={session.tpReviewCurrentSlide || 1}
                            presentationType="TP"
                        />
                    </PixelCard>
                ) : (
                    <div className="text-center py-12 text-slate-500">
                        <p>Menunggu asisten memulai presentasi...</p>
                    </div>
                )}
            </div>
        )}

        {/* JURNAL_REVIEW - Material Review with Presentation */}
        {currentStage === 'JURNAL_REVIEW' && (
            <div className="space-y-6">
                <div className="bg-indigo-900/50 border-2 border-indigo-500 p-6 text-center">
                    <Presentation size={48} className="mx-auto text-indigo-400 mb-4" />
                    <h1 className="text-3xl font-pixel text-white mb-2">REVIEW JURNAL</h1>
                    <p className="text-indigo-300">Perhatikan pembahasan yang disampaikan oleh Asisten Praktikum</p>
                </div>

                {session.jurnalReviewPresentationPath ? (
                    <PixelCard title="JURNAL PRESENTATION">
                        <PresentationViewer 
                            liveSessionId={liveSessionId}
                            presentationUrl={getFileUrl('materials', session.jurnalReviewPresentationPath)}
                            initialSlide={session.jurnalReviewCurrentSlide || 1}
                            presentationType="JURNAL"
                        />
                    </PixelCard>
                ) : (
                    <div className="text-center py-12 text-slate-500">
                        <p>Menunggu asisten memulai presentasi...</p>
                    </div>
                )}
            </div>
        )}

        {currentStage === 'PRETEST' && pretestTask && !hasSubmitted && (
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
                            onClick={() => handleMCQSubmit(pretestTask.id, 'PRETEST')}
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

        {currentStage === 'POSTTEST' && posttestTask && !hasSubmitted && (
            <div className="space-y-6">
                <PixelCard title={`POST-TEST: ${posttestTask.title}`}>
                     <p className="mb-4 text-slate-300" dangerouslySetInnerHTML={{__html: posttestTask.instructions}} />
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
                            onClick={() => handleMCQSubmit(posttestTask.id, 'POSTTEST')}
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
                {!showFeedbackThankYou ? (
                    <div className="text-center space-y-6">
                        <h2 className="text-xl font-bold text-white">Rate this Session</h2>
                        <div className="flex justify-center gap-2">
                            {[1,2,3,4,5].map(star => (
                                <button 
                                    key={star} 
                                    onClick={() => setFeedbackRating(star)}
                                    className={`text-4xl transition-all hover:scale-125 ${feedbackRating >= star ? 'opacity-100' : 'opacity-30'}`}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>
                        <textarea 
                            className="w-full bg-slate-800 border border-slate-600 p-3 text-white min-h-[120px]" 
                            placeholder="Any comments or suggestions?"
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                        ></textarea>
                        <PixelButton variant="primary" onClick={handleFeedbackSubmit}>
                            SEND FEEDBACK
                        </PixelButton>
                    </div>
                ) : (
                    <div className="text-center py-12 space-y-4">
                        <CheckCircle size={64} className="mx-auto text-emerald-400" />
                        <h2 className="text-2xl font-pixel text-emerald-400">TERIMA KASIH!</h2>
                        <p className="text-lg text-slate-300">Telah mengisi feedback</p>
                    </div>
                )}
            </PixelCard>
        )}
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
