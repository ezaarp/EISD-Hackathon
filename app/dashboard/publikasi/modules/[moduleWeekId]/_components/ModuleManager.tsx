'use client';

import { useState } from 'react';
import { createContent, createTask, createQuestion } from '@/app/actions/publikasi';
import { PixelCard, PixelButton } from '@/components/ui';
import { FileText, Plus, X } from 'lucide-react';

export default function ModuleManager({ moduleWeek }: { moduleWeek: any }) {
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState<string | null>(null); // Task ID
  const [loading, setLoading] = useState(false);

  const handleAddMaterial = async (formData: FormData) => {
      setLoading(true);
      try {
          // In a real app, we would upload the file here first
          // const file = formData.get('file');
          // const uploadRes = await uploadFile(file);
          
          // Mocking file path for hackathon
          const mockPath = `materials/week${moduleWeek.weekNo}/${(formData.get('file') as File).name}`;
          
          await createContent(moduleWeek.id, {
              title: formData.get('title') as string,
              type: formData.get('type') as any,
              storagePath: mockPath 
          });
          setShowAddMaterial(false);
      } catch (e) {
          alert('Failed to add material');
      } finally {
          setLoading(false);
      }
  };

  const handleAddTask = async (formData: FormData) => {
      setLoading(true);
      try {
          await createTask(moduleWeek.id, {
              title: formData.get('title') as string,
              type: formData.get('type') as any,
              instructions: formData.get('instructions') as string
          });
          setShowAddTask(false);
      } catch (e) {
          alert('Failed to create task');
      } finally {
          setLoading(false);
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
      } catch (e) {
          alert('Failed to add question');
      } finally {
          setLoading(false);
      }
  };

  return (
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
                        <span className="text-xs bg-slate-800 px-2 py-1 border border-slate-600">{c.type}</span>
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
                            <span className="font-bold text-emerald-400">{t.type}</span>
                            <span className="text-xs text-slate-500">{t.questions.length} Questions</span>
                        </div>
                        <p className="text-sm text-white mb-2">{t.title}</p>
                        
                        {/* Questions List */}
                        <div className="pl-4 border-l-2 border-slate-800 mb-4 space-y-2">
                            {t.questions.map((q: any, idx: number) => (
                                <div key={q.id} className="text-xs text-slate-400 truncate">
                                    {idx + 1}. {q.prompt}
                                </div>
                            ))}
                        </div>

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
                        <select name="type" className="w-full bg-black p-2 text-sm border border-slate-700">
                            <option value="TP">Tugas Pendahuluan</option>
                            <option value="PRETEST">Pre-Test</option>
                            <option value="JURNAL">Jurnal</option>
                            <option value="POSTTEST">Post-Test</option>
                        </select>
                        <input name="title" placeholder="Task Title" className="w-full bg-black p-2 text-sm border border-slate-700" required />
                        <textarea name="instructions" placeholder="Instructions (HTML supported)" className="w-full bg-black p-2 text-sm border border-slate-700" />
                        <PixelButton type="submit" variant="primary" className="w-full" disabled={loading}>
                            CREATE TASK
                        </PixelButton>
                    </form>
                </div>
            )}
        </PixelCard>
    </div>
  );
}

