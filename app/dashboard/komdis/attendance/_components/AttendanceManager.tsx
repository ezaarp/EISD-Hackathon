'use client';

import { useState, useEffect } from 'react';
import { markAttendance } from '@/app/actions/komdis';
import { PixelCard, PixelButton } from '@/components/ui';
import { Check, X, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function AttendanceManager({ session, students, attendances }: { session: any, students: any[], attendances: any[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [localAttendances, setLocalAttendances] = useState(attendances);

  // Initialize Supabase for realtime updates if needed, though Komdis usually initiates
  // But if another Komdis updates, we want to see it.
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => {
      const channel = supabase.channel(`live-${session.id}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'Attendance', 
            filter: `liveSessionId=eq.${session.id}` 
        }, (payload) => {
            setLocalAttendances(prev => [...prev, payload.new]);
        })
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'Attendance', 
            filter: `liveSessionId=eq.${session.id}` 
        }, (payload) => {
            setLocalAttendances(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [session.id]);

  const handleMark = async (studentId: string, status: 'PRESENT' | 'LATE' | 'ABSENT') => {
      setLoading(studentId);
      try {
          await markAttendance(session.id, studentId, status);
          // Optimistic update handled by local state or realtime?
          // Let's do optimistic for immediate feedback
          setLocalAttendances(prev => {
              const existing = prev.find(a => a.studentId === studentId);
              if (existing) {
                  return prev.map(a => a.studentId === studentId ? { ...a, status } : a);
              } else {
                  return [...prev, { studentId, status, liveSessionId: session.id }];
              }
          });
      } catch (e) {
          alert('Failed');
      } finally {
          setLoading(null);
      }
  };

  return (
      <PixelCard title={`ATTENDANCE: ${session.shift.name}`} className="w-full">
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead>
                      <tr className="border-b-2 border-slate-700 text-slate-400">
                          <th className="p-4">NIM</th>
                          <th className="p-4">Name</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody>
                      {students.map(student => {
                          const att = localAttendances.find(a => a.studentId === student.id);
                          const status = att?.status || 'UNMARKED';
                          
                          return (
                              <tr key={student.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                                  <td className="p-4 font-mono text-slate-300">{student.username}</td>
                                  <td className="p-4 font-bold text-white">{student.name}</td>
                                  <td className="p-4 text-center">
                                      <span className={`px-2 py-1 text-xs font-bold ${
                                          status === 'PRESENT' ? 'bg-emerald-500 text-black' :
                                          status === 'LATE' ? 'bg-amber-500 text-black' :
                                          status === 'ABSENT' ? 'bg-rose-500 text-white' :
                                          'bg-slate-700 text-slate-300'
                                      }`}>
                                          {status}
                                      </span>
                                  </td>
                                  <td className="p-4 flex justify-end gap-2">
                                      <button 
                                          onClick={() => handleMark(student.id, 'PRESENT')}
                                          className="p-2 bg-emerald-900 border border-emerald-600 text-emerald-400 hover:bg-emerald-800"
                                          disabled={loading === student.id}
                                      >
                                          <Check size={16} />
                                      </button>
                                      <button 
                                          onClick={() => handleMark(student.id, 'LATE')}
                                          className="p-2 bg-amber-900 border border-amber-600 text-amber-400 hover:bg-amber-800"
                                          disabled={loading === student.id}
                                      >
                                          <Clock size={16} />
                                      </button>
                                      <button 
                                          onClick={() => handleMark(student.id, 'ABSENT')}
                                          className="p-2 bg-rose-900 border border-rose-600 text-rose-400 hover:bg-rose-800"
                                          disabled={loading === student.id}
                                      >
                                          <X size={16} />
                                      </button>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </PixelCard>
  );
}
