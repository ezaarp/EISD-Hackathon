'use client';

import { useState } from 'react';
import { PixelButton, PixelCard } from '@/components/ui';
import { Plus, Trash2, Play } from 'lucide-react';
import { StageType } from '@prisma/client';

const STAGE_OPTIONS: StageType[] = [
  'OPENING',
  'ABSEN',
  'PRETEST',
  'TP_REVIEW',
  'JURNAL_REVIEW',
  'JURNAL',
  'POSTTEST',
  'FEEDBACK'
];

interface RundownStage {
  type: StageType;
  durationMinutes: number;
}

export default function CreateLiveSessionForm({ courses, userId }: { courses: any[], userId: string }) {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [rundown, setRundown] = useState<RundownStage[]>([
    { type: 'OPENING', durationMinutes: 5 },
    { type: 'ABSEN', durationMinutes: 5 }
  ]);

  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  const shifts = selectedCourseData?.shifts || [];
  const modules = selectedCourseData?.modules || [];

  const handleAddStage = () => {
    setRundown([...rundown, { type: 'PRETEST', durationMinutes: 10 }]);
  };

  const handleRemoveStage = (index: number) => {
    setRundown(rundown.filter((_, i) => i !== index));
  };

  const handleStageChange = (index: number, field: 'type' | 'durationMinutes', value: any) => {
    const newRundown = [...rundown];
    newRundown[index] = {
      ...newRundown[index],
      [field]: field === 'durationMinutes' ? parseInt(value) : value
    };
    setRundown(newRundown);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedShift || !selectedModule) {
      alert('Please select shift and module');
      return;
    }

    try {
      const response = await fetch('/api/create-live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: selectedShift,
          moduleWeekId: selectedModule,
          controlledById: userId,
          rundown
        })
      });

      if (!response.ok) throw new Error('Failed to create session');

      const data = await response.json();
      window.location.href = `/live/${data.liveSessionId}/controller`;
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const totalDuration = rundown.reduce((sum, stage) => sum + stage.durationMinutes, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Session Configuration */}
      <PixelCard title="SESSION CONFIGURATION">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2 uppercase">Course</label>
            <select 
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedShift('');
                setSelectedModule('');
              }}
              className="w-full bg-black border border-slate-700 p-3 text-white"
              required
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2 uppercase">Shift</label>
            <select 
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full bg-black border border-slate-700 p-3 text-white"
              required
              disabled={!selectedCourse}
            >
              <option value="">Select Shift</option>
              {shifts.map((shift: any) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name} ({shift._count.studentAssignments} students)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2 uppercase">Module Week</label>
            <select 
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full bg-black border border-slate-700 p-3 text-white"
              required
              disabled={!selectedCourse}
            >
              <option value="">Select Module</option>
              {modules.map((module: any) => (
                <option key={module.id} value={module.id}>
                  Week {module.weekNo} - {module.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </PixelCard>

      {/* Rundown Builder */}
      <PixelCard title="CUSTOM RUNDOWN">
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-slate-300">Total Duration: <span className="font-bold text-emerald-400">{totalDuration} minutes</span></p>
              <p className="text-xs text-slate-500">{rundown.length} stages configured</p>
            </div>
            <PixelButton type="button" variant="secondary" onClick={handleAddStage}>
              <Plus size={16} className="mr-2" />
              ADD STAGE
            </PixelButton>
          </div>

          {rundown.map((stage, index) => (
            <div key={index} className="bg-slate-800 border border-slate-700 p-4 flex items-center gap-4">
              <div className="text-slate-500 font-bold text-lg w-8">{index + 1}.</div>
              
              <div className="flex-1">
                <select 
                  value={stage.type}
                  onChange={(e) => handleStageChange(index, 'type', e.target.value)}
                  className="w-full bg-black border border-slate-600 p-2 text-white"
                >
                  {STAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="w-40">
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    value={stage.durationMinutes}
                    onChange={(e) => handleStageChange(index, 'durationMinutes', e.target.value)}
                    className="w-full bg-black border border-slate-600 p-2 text-white text-center"
                    min="1"
                    max="180"
                  />
                  <span className="text-slate-400 text-sm">min</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveStage(index)}
                className="text-rose-500 hover:text-rose-400 p-2"
                disabled={rundown.length <= 1}
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}

          {rundown.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p>No stages added yet. Click "ADD STAGE" to start building your rundown.</p>
            </div>
          )}
        </div>
      </PixelCard>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <PixelButton type="button" variant="outline" href="/dashboard/publikasi/live-session">
          CANCEL
        </PixelButton>
        <PixelButton type="submit" variant="success" className="px-8">
          <Play size={20} className="mr-2" />
          CREATE & START SESSION
        </PixelButton>
      </div>
    </form>
  );
}

