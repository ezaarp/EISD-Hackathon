'use client';

import { useState } from 'react';
import { createContent, createTask, createQuestion, uploadMaterial, deleteContent, deleteTask, updateTask, updateQuestion } from '@/app/actions/publikasi';
import { PixelCard, PixelButton } from '@/components/ui';
import { FileText, Plus, X, Trash2, Edit, Upload, Play } from 'lucide-react';

export default function ModuleManager({ moduleWeek }: { moduleWeek: any }) {
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState<string | null>(null); // Task ID
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddMaterial = async (formData: FormData) => {
      setLoading(true);
      try {
          // Upload file first
          const storagePath = await uploadMaterial(formData);
          
          await createContent(moduleWeek.id, {
              title: formData.get('title') as string,
              type: formData.get('type') as any,
              storagePath: storagePath 
          });
          setShowAddMaterial(false);
          window.location.reload(); // Refresh to show new content
      } catch (e: any) {
          alert('Failed to add material: ' + e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleAddTask = async (formData: FormData) => {
      setLoading(true);
      try {
          // Now createTask handles files internally
          await createTask(formData);
          setShowAddTask(false);
          window.location.reload(); // Refresh
      } catch (e: any) {
          alert('Failed to create task: ' + e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteContent = async (id: string) => {
      if (!confirm('Delete this content?')) return;
      try {
          await deleteContent(id);
          window.location.reload();
      } catch (e) {
          alert('Failed to delete');
      }
  };

  const handleDeleteTask = async (id: string) => {
      if (!confirm('Delete this task?')) return;
      try {
          await deleteTask(id);
          window.location.reload();
      } catch (e) {
          alert('Failed to delete');
      }
  };

  const handleAddQuestion = async (formData: FormData) => {
      if (!showAddQuestion) return;
      setLoading(true);
      try {
          await createQuestion(showAddQuestion, {
              prompt: formData.get('prompt') as string,
              type: formData.get('type') as any,
              options: formData.get('options') as string, // Should be JSON string
              correctAnswer: formData.get('correctAnswer') as string,
              points: parseFloat(formData.get('points') as string)
          });
          setShowAddQuestion(null);
          window.location.reload();
      } catch (e: any) {
          alert('Failed to add question: ' + e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleEditTask = async (formData: FormData) => {
      setLoading(true);
      try {
          await updateTask(formData);
          setEditingTaskId(null);
          window.location.reload();
      } catch (e: any) {
          alert('Failed to update task: ' + e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleEditQuestion = async (formData: FormData) => {
      setLoading(true);
      try {
          await updateQuestion(formData);
          setEditingQuestionId(null);
          window.location.reload();
      } catch (e: any) {
          alert('Failed to update question: ' + e.message);
      } finally {
          setLoading(false);
      }
  };

  // Find TP tasks
  const tpTasks = moduleWeek.tasks.filter((t: any) => t.type.toUpperCase() === 'TP');

  return (
    <div className="space-y-8">
        {/* TP START SECTION (if any TP exists) */}
        {tpTasks.length > 0 && (
            <PixelCard title="TUGAS PENDAHULUAN (TP)" color="bg-indigo-900/50">
                <div className="space-y-4">
                    {tpTasks.map((tp: any) => (
                        <div key={tp.id} className="bg-slate-900 p-4 border border-slate-700 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-white">{tp.title}</h4>
                                <p className="text-xs text-slate-400">{tp.questions.length} Questions</p>
                            </div>
                            <PixelButton 
                                variant="success" 
                                className="text-xs"
                                onClick={async () => {
                                    if (confirm('Start TP? This will send an announcement to all students.')) {
                                        // Call startTP action
                                        const { startTP } = await import('@/app/actions/publikasi');
                                        await startTP(moduleWeek.id);
                                        alert('TP Started! Students have been notified.');
                                    }
                                }}
                            >
                                <Play size={14} className="mr-2" />
                                START TP
                            </PixelButton>
                        </div>
                    ))}
                </div>
            </PixelCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* MATERIALS SECTION */}
            <PixelCard title="MATERIALS">
                <div className="space-y-4 mb-6">
                    {moduleWeek.contents.map((c: any) => (
                        <div key={c.id} className="p-3 bg-slate-900 border border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-indigo-400" />
                                <span className="text-sm">{c.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-slate-800 px-2 py-1 border border-slate-600">{c.type}</span>
                                <button onClick={() => handleDeleteContent(c.id)} className="text-rose-500 hover:text-rose-400">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {moduleWeek.contents.length === 0 && <p className="text-slate-500 text-xs italic">No materials yet.</p>}
                </div>
                
                {!showAddMaterial ? (
                    <PixelButton variant="secondary" className="w-full" onClick={() => setShowAddMaterial(true)}>
                        + ADD MATERIAL
                    </PixelButton>
                ) : (
                    <div className="bg-slate-900 p-4 border border-slate-600 relative">
                        <button onClick={() => setShowAddMaterial(false)} className="absolute top-2 right-2 text-slate-400"><X size={16} /></button>
                        <form action={handleAddMaterial} className="space-y-3">
                            <p className="text-xs font-bold text-emerald-400 mb-2">UPLOAD NEW MATERIAL</p>
                            <input type="hidden" name="moduleWeekId" value={moduleWeek.id} />
                            <input name="title" placeholder="Title" className="w-full bg-black p-2 text-sm border border-slate-700" required />
                            <select name="type" className="w-full bg-black p-2 text-sm border border-slate-700">
                                <option value="PDF">PDF Document</option>
                                <option value="PPT_PDF">PPT (PDF)</option>
                                <option value="ZIP">ZIP Archive</option>
                                <option value="VIDEO">Video</option>
                            </select>
                            <input type="file" name="file" className="w-full text-sm text-slate-400" required />
                            <PixelButton type="submit" variant="primary" className="w-full" disabled={loading}>
                                {loading ? 'UPLOADING...' : 'UPLOAD'}
                            </PixelButton>
                        </form>
                    </div>
                )}
            </PixelCard>

            {/* TASKS SECTION */}
            <PixelCard title="TASKS & QUESTIONS">
                <div className="space-y-6 mb-6">
                    {moduleWeek.tasks.map((t: any) => (
                        <div key={t.id} className="bg-slate-900 border border-slate-700 p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-emerald-400 uppercase">{t.type}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{t.questions.length} Questions</span>
                                    <button onClick={() => setEditingTaskId(prev => prev === t.id ? null : t.id)} className="text-indigo-400 hover:text-indigo-300">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteTask(t.id)} className="text-rose-500 hover:text-rose-400">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-white mb-2">{t.title}</p>
                            
                            {/* File Indicators */}
                            {(t.instructionPath || t.templatePath) && (
                                <div className="flex gap-2 mb-2 text-xs text-indigo-400">
                                    {t.instructionPath && <span className="flex items-center gap-1"><FileText size={12} /> Instr. PDF</span>}
                                    {t.templatePath && <span className="flex items-center gap-1"><FileText size={12} /> Template ZIP</span>}
                                </div>
                            )}

                            {/* Questions List */}
                            <div className="pl-4 border-l-2 border-slate-800 mb-4 space-y-2">
                                {t.questions.map((q: any, idx: number) => (
                                    <div key={q.id} className="text-xs text-slate-400">
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="truncate">{idx + 1}. {q.prompt}</span>
                                            <button
                                                onClick={() => setEditingQuestionId(prev => prev === q.id ? null : q.id)}
                                                className="text-emerald-400 hover:text-emerald-300"
                                            >
                                                <Edit size={12} />
                                            </button>
                                        </div>

                                        {editingQuestionId === q.id && (
                                            <div className="mt-2 bg-black border border-slate-700 p-3 relative">
                                                <button
                                                    onClick={() => setEditingQuestionId(null)}
                                                    className="absolute top-2 right-2 text-slate-400"
                                                >
                                                    <X size={12} />
                                                </button>
                                                <form action={handleEditQuestion} className="space-y-2">
                                                    <input type="hidden" name="questionId" value={q.id} />
                                                    <label className="text-[10px] text-slate-400 uppercase">Prompt</label>
                                                    <textarea
                                                        name="prompt"
                                                        defaultValue={q.prompt}
                                                        className="w-full bg-slate-900 p-2 text-xs border border-slate-700"
                                                        required
                                                    />
                                                    {q.type === 'MCQ' && (
                                                        <>
                                                            <label className="text-[10px] text-slate-400 uppercase">Options JSON</label>
                                                            <textarea
                                                                name="options"
                                                                defaultValue={q.optionsJson || ''}
                                                                className="w-full bg-slate-900 p-2 text-xs border border-slate-700"
                                                                placeholder='["Option A","Option B"]'
                                                            />
                                                        </>
                                                    )}
                                                    <label className="text-[10px] text-slate-400 uppercase">Correct Answer</label>
                                                    <input
                                                        name="correctAnswer"
                                                        defaultValue={q.answerKey?.correctAnswer || ''}
                                                        className="w-full bg-slate-900 p-2 text-xs border border-slate-700"
                                                        required
                                                    />
                                                    <label className="text-[10px] text-slate-400 uppercase">Points</label>
                                                    <input
                                                        type="number"
                                                        name="points"
                                                        defaultValue={q.points || 10}
                                                        className="w-full bg-slate-900 p-2 text-xs border border-slate-700"
                                                        step="0.5"
                                                        min="0"
                                                        required
                                                    />
                                                    <PixelButton type="submit" variant="success" className="w-full text-xs" disabled={loading}>
                                                        SAVE CHANGES
                                                    </PixelButton>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {editingTaskId === t.id && (
                                <div className="bg-black p-3 border border-slate-700 mb-4 relative">
                                    <button onClick={() => setEditingTaskId(null)} className="absolute top-2 right-2 text-slate-400">
                                        <X size={12} />
                                    </button>
                                    <form action={handleEditTask} className="space-y-2">
                                        <input type="hidden" name="taskId" value={t.id} />
                                        <label className="text-[10px] text-slate-400 uppercase">Type</label>
                                        <input
                                            name="type"
                                            defaultValue={t.type}
                                            className="w-full bg-slate-900 p-2 text-xs border border-slate-700"
                                        />
                                        <label className="text-[10px] text-slate-400 uppercase">Title</label>
                                        <input
                                            name="title"
                                            defaultValue={t.title}
                                            className="w-full bg-slate-900 p-2 text-xs border border-slate-700"
                                            required
                                        />
                                        <label className="text-[10px] text-slate-400 uppercase">Instructions (HTML)</label>
                                        <textarea
                                            name="instructions"
                                            defaultValue={t.instructions || ''}
                                            className="w-full bg-slate-900 p-2 text-xs border border-slate-700 min-h-[120px]"
                                        />
                                        <PixelButton type="submit" variant="primary" className="w-full text-xs" disabled={loading}>
                                            SAVE TASK
                                        </PixelButton>
                                    </form>
                                </div>
                            )}

                            {!showAddQuestion ? (
                                <PixelButton variant="outline" className="text-xs w-full" onClick={() => setShowAddQuestion(t.id)}>
                                    + ADD QUESTION
                                </PixelButton>
                            ) : showAddQuestion === t.id && (
                                <div className="bg-black p-3 border border-slate-600 mt-2 relative">
                                    <button onClick={() => setShowAddQuestion(null)} className="absolute top-2 right-2 text-slate-400"><X size={14} /></button>
                                    <form action={handleAddQuestion} className="space-y-2">
                                        <p className="text-xs font-bold text-amber-400">NEW QUESTION</p>
                                        <select name="type" className="w-full bg-slate-900 p-1 text-xs border border-slate-700">
                                            <option value="MCQ">Multiple Choice</option>
                                            <option value="CODE">Code Based</option>
                                        </select>
                                        <textarea name="prompt" placeholder="Question Prompt" className="w-full bg-slate-900 p-2 text-xs border border-slate-700" required />
                                        <textarea name="options" placeholder='Options JSON (e.g. ["A","B"]) for MCQ' className="w-full bg-slate-900 p-2 text-xs border border-slate-700" />
                                        <input name="correctAnswer" placeholder="Correct Answer / Output" className="w-full bg-slate-900 p-2 text-xs border border-slate-700" required />
                                        <input name="points" type="number" placeholder="Points" className="w-full bg-slate-900 p-2 text-xs border border-slate-700" required />
                                        <PixelButton type="submit" variant="success" className="w-full py-1 text-xs" disabled={loading}>SAVE QUESTION</PixelButton>
                                    </form>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {!showAddTask ? (
                    <PixelButton variant="primary" className="w-full" onClick={() => setShowAddTask(true)}>
                        + CREATE NEW TASK
                    </PixelButton>
                ) : (
                    <div className="bg-slate-900 p-4 border border-slate-600 relative">
                        <button onClick={() => setShowAddTask(false)} className="absolute top-2 right-2 text-slate-400"><X size={16} /></button>
                        <form action={handleAddTask} className="space-y-3">
                            <p className="text-xs font-bold text-emerald-400 mb-2">NEW TASK CONFIG</p>
                            <input type="hidden" name="moduleWeekId" value={moduleWeek.id} />
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-slate-500">Task Type (Any Name)</label>
                                    <input 
                                        name="type" 
                                        list="taskTypes" 
                                        placeholder="e.g. TP, JURNAL" 
                                        className="w-full bg-black p-2 text-sm border border-slate-700" 
                                        required 
                                    />
                                    <datalist id="taskTypes">
                                        <option value="TP" />
                                        <option value="PRETEST" />
                                        <option value="JURNAL" />
                                        <option value="POSTTEST" />
                                        <option value="QUIZ" />
                                        <option value="CODING_CHALLENGE" />
                                    </datalist>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500">Title</label>
                                    <input name="title" placeholder="Task Title" className="w-full bg-black p-2 text-sm border border-slate-700" required />
                                </div>
                            </div>

                            <textarea name="instructions" placeholder="Instructions (HTML supported)" className="w-full bg-black p-2 text-sm border border-slate-700" />
                            
                            <div className="space-y-2 border-t border-slate-800 pt-2">
                                <p className="text-xs text-slate-400">Attachments</p>
                                <div>
                                    <label className="block text-xs text-indigo-400 mb-1 flex items-center gap-1"><FileText size={12}/> Instruction PDF</label>
                                    <input type="file" name="instructionFile" accept=".pdf" className="w-full text-xs text-slate-500" />
                                </div>
                                <div>
                                    <label className="block text-xs text-indigo-400 mb-1 flex items-center gap-1"><Upload size={12}/> Template ZIP (Optional)</label>
                                    <input type="file" name="templateFile" accept=".zip" className="w-full text-xs text-slate-500" />
                                </div>
                            </div>

                            <PixelButton type="submit" variant="primary" className="w-full" disabled={loading}>
                                {loading ? 'CREATING...' : 'CREATE TASK'}
                            </PixelButton>
                        </form>
                    </div>
                )}
            </PixelCard>
        </div>
    </div>
  );
}
