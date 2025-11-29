'use client';

import { useState } from 'react';
import { createShift } from '@/app/actions/laboran';
import { PixelCard, PixelButton } from '@/components/ui';
import { Plus, X } from 'lucide-react';

export default function AddShiftModal({ courseId, onClose }: { courseId: string, onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await createShift(courseId, {
        shiftNo: parseInt(formData.get('shiftNo') as string),
        name: formData.get('name') as string,
        day: formData.get('day') as string,
        startTime: formData.get('startTime') as string,
        endTime: formData.get('endTime') as string,
        room: formData.get('room') as string,
        maxCapacity: parseInt(formData.get('maxCapacity') as string),
      });
      onClose();
    } catch (error: any) {
      const message = error?.message || 'Failed to create shift';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <PixelCard title="ADD SHIFT" className="w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Shift No</label>
              <input name="shiftNo" type="number" className="w-full bg-slate-900 border border-slate-600 p-2 text-white" required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Name</label>
              <input name="name" placeholder="e.g. Shift 1 Pagi" className="w-full bg-slate-900 border border-slate-600 p-2 text-white" required />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Day</label>
            <select name="day" className="w-full bg-slate-900 border border-slate-600 p-2 text-white" required>
              <option value="SENIN">SENIN</option>
              <option value="SELASA">SELASA</option>
              <option value="RABU">RABU</option>
              <option value="KAMIS">KAMIS</option>
              <option value="JUMAT">JUMAT</option>
              <option value="SABTU">SABTU</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Start Time</label>
              <input name="startTime" type="time" className="w-full bg-slate-900 border border-slate-600 p-2 text-white" required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">End Time</label>
              <input name="endTime" type="time" className="w-full bg-slate-900 border border-slate-600 p-2 text-white" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Room</label>
              <input name="room" placeholder="e.g. A203" className="w-full bg-slate-900 border border-slate-600 p-2 text-white" required />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Capacity</label>
              <input name="maxCapacity" type="number" defaultValue={30} className="w-full bg-slate-900 border border-slate-600 p-2 text-white" required />
            </div>
          </div>

          <PixelButton type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'CREATING...' : 'CREATE SHIFT'}
          </PixelButton>
        </form>
      </PixelCard>
    </div>
  );
}

