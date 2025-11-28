'use client';

import { useState } from 'react';
import { createPlotting, autoAssignStudentsToShift } from '@/app/actions/secretary';
import { PixelCard, PixelButton } from '@/components/ui';
import { User, Check } from 'lucide-react';

export default function PlottingManager({ shifts, assistants }: { shifts: any[], assistants: any[] }) {
  const [selectedShift, setSelectedShift] = useState<string>(shifts[0]?.id || '');
  const [loading, setLoading] = useState(false);
  
  // State for managing plots
  const activeShift = shifts.find(s => s.id === selectedShift);

  const handleAssignAssistant = async (assistantId: string, plotNo: number) => {
      if (!selectedShift) return;
      setLoading(true);
      try {
          await createPlotting(selectedShift, assistantId, plotNo);
      } catch (e) {
          alert('Failed to assign');
      } finally {
          setLoading(false);
      }
  };

  const handleAutoAssignStudents = async () => {
      const nims = prompt("Enter Student NIMs to auto-assign (comma separated):");
      if (!nims) return;
      
      setLoading(true);
      try {
          const nimList = nims.split(',').map(s => s.trim());
          const res = await autoAssignStudentsToShift(selectedShift, nimList);
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
        <PixelCard title="SELECT SHIFT">
            <div className="flex gap-4 overflow-x-auto pb-2">
                {shifts.map(shift => (
                    <button
                        key={shift.id}
                        onClick={() => setSelectedShift(shift.id)}
                        className={`px-4 py-2 font-pixel text-xs whitespace-nowrap transition-all ${
                            selectedShift === shift.id
                            ? 'bg-emerald-500 text-black translate-y-1'
                            : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                    >
                        {shift.name} ({shift.day})
                    </button>
                ))}
            </div>
        </PixelCard>

        {activeShift && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <PixelCard title={`PLOTTING: ${activeShift.name}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4, 5].map(plotNo => {
                                const currentPlot = activeShift.plottings.find((p: any) => p.plotNo === plotNo);
                                
                                return (
                                    <div key={plotNo} className="p-4 border-2 border-slate-700 bg-slate-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-emerald-400">PLOT {plotNo}</span>
                                            {currentPlot && <Check size={16} className="text-emerald-500" />}
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
                                Distributes students evenly among defined plots for this shift.
                            </p>
                        </div>
                    </PixelCard>
                </div>
            </div>
        )}
    </div>
  );
}

