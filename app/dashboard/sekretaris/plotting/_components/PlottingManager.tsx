'use client';

import { useState, useEffect } from 'react';
import { createPlotting, autoAssignStudentsToShift, updateStudentAssignment, deletePlotting } from '@/app/actions/secretary';
import { PixelCard, PixelButton } from '@/components/ui';
import { Check, Plus, Trash2, Pencil } from 'lucide-react';

const StudentRow = ({
  assignment,
  plots,
  isExpanded,
  onToggle,
  onMove,
  loading,
}: {
  assignment: any;
  plots: any[];
  isExpanded: boolean;
  onToggle: () => void;
  onMove: (assignmentId: string, targetPlotId: string) => void;
  loading: boolean;
}) => {
  return (
    <li className="border border-slate-700 p-2 rounded bg-slate-900/60">
      <div className="flex justify-between items-center gap-2 text-emerald-400 font-semibold">
        <div>
          <p className="truncate">{assignment.student?.name || 'Unknown'}</p>
          <p className="text-slate-400 text-[10px]">{assignment.student?.username}</p>
        </div>
        <button
          onClick={onToggle}
          className="text-slate-300 hover:text-white"
        >
          <Pencil size={12} />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-2 border-t border-slate-800 pt-2">
          <div>
            <label className="text-[10px] text-slate-500 uppercase">Move to plot</label>
            <select
              className="w-full bg-slate-900 border border-slate-700 p-1 text-[11px]"
              defaultValue={assignment.plottingId}
              onChange={(e) => onMove(assignment.id, e.target.value)}
              disabled={loading}
            >
              {plots.map((plot: any) => (
                <option key={plot.id} value={plot.id}>
                  Plot {plot.plotNo}
                </option>
              ))}
            </select>
          </div>
          <PixelButton
            variant="danger"
            className="w-full text-[11px]"
            onClick={() => onMove(assignment.id, '')}
            disabled={loading}
          >
            Remove from Plot
          </PixelButton>
        </div>
      )}
    </li>
  );
};

export default function PlottingManager({ shifts, assistants }: { shifts: any[], assistants: any[] }) {
  // Extract unique courses from shifts
  const courses = Array.from(new Set(shifts.map(s => s.course.id))).map(id => {
      return shifts.find(s => s.course.id === id)?.course;
  });

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [plotCount, setPlotCount] = useState(5);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);

  // Filter shifts by course
  const filteredShifts = shifts.filter(s => s.courseId === selectedCourseId);

  // Set default shift when course changes
  useEffect(() => {
      if (filteredShifts.length > 0) {
          setSelectedShiftId(filteredShifts[0].id);
      } else {
          setSelectedShiftId('');
      }
  }, [selectedCourseId]);

  const activeShift = shifts.find(s => s.id === selectedShiftId);

  useEffect(() => {
      if (activeShift?.plottings) {
          const totalPlots = Math.max(5, activeShift.plottings.length);
          setPlotCount(totalPlots);
      } else {
          setPlotCount(5);
      }
  }, [activeShift]);

  const handleAssignAssistant = async (assistantId: string, plotNo: number) => {
      if (!selectedShiftId) return;
      setLoading(true);
      try {
          await createPlotting(selectedShiftId, assistantId, plotNo);
      } catch (e) {
          alert('Failed to assign');
      } finally {
          setLoading(false);
      }
  };

  const handleAutoAssignStudents = async () => {
  const handleStudentMove = async (assignmentId: string, targetPlotId: string) => {
      setLoading(true);
      try {
          if (targetPlotId) {
              await updateStudentAssignment(assignmentId, targetPlotId);
          } else {
              await updateStudentAssignment(assignmentId, '');
          }
      } catch (e) {
          alert('Failed to move student');
      } finally {
          setLoading(false);
      }
  };

  const handleDeletePlot = async (plottingId?: string) => {
      if (!plottingId) return;
      if (!confirm('Delete this plot? All students inside will be unassigned.')) return;

      setLoading(true);
      try {
          await deletePlotting(plottingId);
      } catch (e) {
          alert('Failed to delete plot');
      } finally {
          setLoading(false);
      }
  };
      const nims = prompt("Enter Student NIMs to auto-assign (comma separated):");
      if (!nims) return;
      
      setLoading(true);
      try {
          const nimList = nims.split(',').map(s => s.trim());
          const res = await autoAssignStudentsToShift(selectedShiftId, nimList);
          if (res.success) alert(`Assigned ${res.assignedCount} students`);
          else alert(res.error);
      } catch (e) {
          alert('Failed');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-6">
        {/* 1. Select Course */}
        <PixelCard title="1. SELECT COURSE">
            <div className="flex gap-4 overflow-x-auto pb-2">
                {courses.map(course => (
                    <button
                        key={course?.id}
                        onClick={() => setSelectedCourseId(course?.id || '')}
                        className={`px-4 py-2 font-pixel text-xs whitespace-nowrap transition-all ${
                            selectedCourseId === course?.id
                            ? 'bg-indigo-500 text-white translate-y-1'
                            : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                    >
                        {course?.code}
                    </button>
                ))}
            </div>
        </PixelCard>

        {/* 2. Select Shift */}
        {selectedCourseId && (
            <PixelCard title="2. SELECT SHIFT">
                {filteredShifts.length > 0 ? (
                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 uppercase font-bold">Available Shifts</label>
                        <select
                            value={selectedShiftId}
                            onChange={(e) => setSelectedShiftId(e.target.value)}
                            className="w-full bg-slate-900 border-2 border-emerald-500 p-3 text-white font-pixel text-sm"
                        >
                            {filteredShifts.map(shift => (
                                <option key={shift.id} value={shift.id}>
                                    {shift.name} — {shift.day} ({shift.startTime}-{shift.endTime})
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <p className="text-slate-500 text-xs">No shifts found for this course.</p>
                )}
            </PixelCard>
        )}

        {/* 3. Plotting Interface */}
        {activeShift && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <PixelCard title={`PLOTTING: ${activeShift.name}`}>
                        <div className="flex justify-end mb-4">
                            <PixelButton
                                variant="secondary"
                                className="text-xs flex items-center gap-2"
                                onClick={() => setPlotCount(prev => Math.min(prev + 1, 12))}
                                disabled={plotCount >= 12}
                            >
                                <Plus size={12} />
                                ADD PLOT
                            </PixelButton>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: plotCount }, (_, idx) => idx + 1).map(plotNo => {
                                const currentPlot = activeShift.plottings.find((p: any) => p.plotNo === plotNo);
                                
                                return (
                                    <div key={plotNo} className="p-4 border-2 border-slate-700 bg-slate-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-emerald-400">PLOT {plotNo}</span>
                                            <div className="flex items-center gap-2">
                                                {currentPlot && (
                                                    <button
                                                        onClick={() => handleDeletePlot(currentPlot?.id)}
                                                        className="text-rose-400 hover:text-rose-300"
                                                        disabled={loading}
                                                        title="Delete plot"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                                {currentPlot && <Check size={16} className="text-emerald-500" />}
                                            </div>
                                        </div>
                                        
                                        <select 
                                            className="w-full bg-slate-900 border border-slate-600 p-2 text-sm mb-2"
                                            value={currentPlot?.assistantId || ''}
                                            onChange={(e) => handleAssignAssistant(e.target.value, plotNo)}
                                            disabled={loading}
                                        >
                                            <option value="">Select Assistant</option>
                                            {assistants.map(ast => (
                                                <option key={ast.id} value={ast.id}>{ast.name}</option>
                                            ))}
                                        </select>
                                        
                                        {currentPlot && (
                                            <p className="text-xs text-slate-500 mt-2">
                                                Assigned: {currentPlot.assistant.name}
                                            </p>
                                        )}
                                        
                                        <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                                            <p className="text-xs text-slate-400 font-bold">Students</p>
                                            {currentPlot?.studentAssignments?.length ? (
                                                <ul className="space-y-2 text-[11px] text-slate-300 max-h-32 overflow-y-auto pr-1">
                                                    {currentPlot.studentAssignments.map((assignment: any) => (
                                                        <StudentRow
                                                            key={assignment.id}
                                                            assignment={assignment}
                                                            plots={activeShift.plottings}
                                                            isExpanded={expandedAssignmentId === assignment.id}
                                                            onToggle={() => setExpandedAssignmentId(prev => prev === assignment.id ? null : assignment.id)}
                                                            onMove={handleStudentMove}
                                                            loading={loading}
                                                        />
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-[11px] text-slate-500">Belum ada praktikan.</p>
                                            )}
                                            <p className="text-[11px] text-slate-500">
                                                Max Capacity: 7 Students
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </PixelCard>
                </div>

                <div className="space-y-6">
                    <PixelCard title="ACTIONS">
                        <div className="space-y-4">
                            <PixelButton variant="warning" className="w-full" onClick={handleAutoAssignStudents}>
                                AUTO-ASSIGN STUDENTS
                            </PixelButton>
                            <p className="text-xs text-slate-400">
                                Distributes students evenly among defined plots for this shift (Max 7 per plot).
                            </p>
                        </div>
                    </PixelCard>
                </div>
            </div>
        )}
    </div>
  );
}
