'use client';

import { useState } from 'react';
import { PixelButton, PixelCard } from '@/components/ui';
import { Upload, FileText, Save } from 'lucide-react';
import { updateLiveSession, uploadPresentation } from '@/app/actions/presentation';
import { getFileUrl } from '@/lib/supabase';

export default function EditLiveSessionForm({ liveSession, course }: { liveSession: any, course: any }) {
  const [selectedShift, setSelectedShift] = useState(liveSession.shiftId);
  const [selectedModule, setSelectedModule] = useState(liveSession.moduleWeekId);
  const [notes, setNotes] = useState(liveSession.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateLiveSession(liveSession.id, {
        shiftId: selectedShift,
        moduleWeekId: selectedModule,
        notes
      });
      alert('Live session updated successfully!');
      window.location.href = '/dashboard/publikasi/live-session';
    } catch (error: any) {
      alert('Failed to update: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresentationUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setIsUploading(true);
    try {
      await uploadPresentation(liveSession.id, formData);
      alert('Presentation uploaded successfully!');
      window.location.reload();
    } catch (error: any) {
      alert('Failed to upload: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Basic Info Form */}
      <form onSubmit={handleUpdate}>
        <PixelCard title="SESSION CONFIGURATION">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2 uppercase">Shift</label>
              <select 
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="w-full bg-black border border-slate-700 p-3 text-white"
                disabled={liveSession.status === 'ACTIVE' || liveSession.status === 'COMPLETED'}
              >
                {course.shifts.map((shift: any) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} - {shift.day} {shift.startTime}-{shift.endTime}
                  </option>
                ))}
              </select>
              {(liveSession.status === 'ACTIVE' || liveSession.status === 'COMPLETED') && (
                <p className="text-xs text-amber-500 mt-1">Cannot change shift for active/completed sessions</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2 uppercase">Module Week</label>
              <select 
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full bg-black border border-slate-700 p-3 text-white"
              >
                {course.modules.map((module: any) => (
                  <option key={module.id} value={module.id}>
                    Week {module.weekNo} - {module.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2 uppercase">Notes / Rundown</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-black border border-slate-700 p-3 text-white min-h-[120px]"
                placeholder="Add session notes or custom rundown details..."
              />
            </div>

            <PixelButton type="submit" variant="primary" disabled={isLoading} className="w-full">
              <Save size={20} className="mr-2" />
              {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
            </PixelButton>
          </div>
        </PixelCard>
      </form>

      {/* Presentation Upload */}
      <PixelCard title="PRESENTATION SLIDES (For Review Stages)">
        <div className="space-y-4">
          <p className="text-sm text-slate-300 mb-4">
            Upload a PDF presentation (landscape) that will be displayed during TP_REVIEW and JURNAL_REVIEW stages. 
            Praktikan will see the same slides in sync with your controls.
          </p>

          {liveSession.presentationPath && (
            <div className="bg-emerald-900/50 border border-emerald-500 p-4 mb-4">
              <div className="flex items-center gap-3">
                <FileText size={32} className="text-emerald-400" />
                <div>
                  <p className="font-bold text-white">Current Presentation</p>
                  <p className="text-xs text-emerald-300">{liveSession.presentationPath.split('/').pop()}</p>
                </div>
              </div>
              <div className="mt-3">
                <PixelButton 
                  href={getFileUrl('materials', liveSession.presentationPath)}
                  variant="outline"
                  className="text-xs"
                >
                  VIEW PRESENTATION
                </PixelButton>
              </div>
            </div>
          )}

          <form onSubmit={handlePresentationUpload}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2 uppercase">
                  Upload New Presentation (PDF)
                </label>
                <input 
                  type="file" 
                  name="presentation" 
                  accept=".pdf"
                  className="w-full bg-black border border-slate-700 p-3 text-white"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Recommended: Landscape orientation (16:9 or 4:3)
                </p>
              </div>

              <PixelButton 
                type="submit" 
                variant="success" 
                disabled={isUploading}
                className="w-full"
              >
                <Upload size={20} className="mr-2" />
                {isUploading ? 'UPLOADING...' : 'UPLOAD PRESENTATION'}
              </PixelButton>
            </div>
          </form>
        </div>
      </PixelCard>

      {/* Session Info */}
      <PixelCard title="SESSION INFO">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Status</span>
            <span className={`font-bold ${
              liveSession.status === 'ACTIVE' ? 'text-emerald-400' : 
              liveSession.status === 'COMPLETED' ? 'text-slate-500' : 
              'text-amber-400'
            }`}>
              {liveSession.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Current Stage</span>
            <span className="text-white">{liveSession.currentStageIndex}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Created</span>
            <span className="text-white">{new Date(liveSession.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </PixelCard>
    </div>
  );
}

