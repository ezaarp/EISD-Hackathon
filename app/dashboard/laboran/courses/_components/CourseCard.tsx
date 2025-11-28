'use client';

import { useState } from 'react';
import { PixelCard, PixelButton } from '@/components/ui';
import AddShiftModal from './_components/AddShiftModal';

export default function CourseCard({ course }: { course: any }) {
  const [showAddShift, setShowAddShift] = useState(false);

  return (
    <>
      <PixelCard title={course.code} className="mb-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">{course.title}</h3>
          <p className="text-slate-400 text-sm">{course.description}</p>
          <p className="text-xs text-emerald-400 mt-2 font-mono bg-slate-900 inline-block px-2 py-1 border border-emerald-900">
             ENROLL PASS: {course.enrollPasswordHash ? '****' : 'N/A'} (See Seed/DB)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {course.shifts.map((shift: any) => (
            <div key={shift.id} className="p-3 bg-slate-900 border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-emerald-400">{shift.name}</p>
                  <p className="text-xs text-slate-400">{shift.day} • {shift.startTime}-{shift.endTime}</p>
                  <p className="text-xs text-slate-500">{shift.room} (Max: {shift.maxCapacity})</p>
                </div>
              </div>
            </div>
          ))}
          <button 
            onClick={() => setShowAddShift(true)}
            className="p-3 bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-700 w-full transition-colors"
          >
            <span className="text-xs text-slate-400">+ Add Shift</span>
          </button>
        </div>
      </PixelCard>

      {showAddShift && (
        <AddShiftModal courseId={course.id} onClose={() => setShowAddShift(false)} />
      )}
    </>
  );
}

