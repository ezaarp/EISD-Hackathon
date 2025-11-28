'use client';

import { useState } from 'react';
import { PixelCard, PixelButton } from '@/components/ui';
import { updateGrade, approveGrade, rejectGrade } from '@/app/actions/grading';
import { CheckCircle, XCircle } from 'lucide-react';

export default function GradingForm({ submission }: { submission: any }) {
  const [score, setScore] = useState(submission.grade?.score ?? 0);
  const [notes, setNotes] = useState(submission.grade?.notes ?? '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (score < 0 || score > 100) {
      alert('Score must be between 0 and 100');
      return;
    }

    setIsLoading(true);
    try {
      await updateGrade(submission.id, score, notes);
      alert('Grade saved successfully!');
    } catch (error: any) {
      alert('Failed to save: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this grade? Student will see the score.')) return;

    setIsLoading(true);
    try {
      await approveGrade(submission.id, score, notes);
      alert('Grade approved!');
      window.location.href = '/dashboard/asisten/grading';
    } catch (error: any) {
      alert('Failed to approve: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    setIsLoading(true);
    try {
      await rejectGrade(submission.id, reason);
      alert('Grade rejected');
      window.location.href = '/dashboard/asisten/grading';
    } catch (error: any) {
      alert('Failed to reject: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isApproved = submission.grade?.status === 'APPROVED';
  const isRejected = submission.grade?.status === 'REJECTED';

  return (
    <PixelCard title="GRADING">
      <div className="space-y-4">
        {/* Manual Input Section */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 uppercase font-bold">
            {isApproved || isRejected ? 'Final Score' : 'Enter Score'}
          </label>
          <input 
            type="number" 
            value={score}
            onChange={(e) => setScore(parseFloat(e.target.value))}
            className="w-full bg-black border-2 border-emerald-500 p-4 text-white text-center text-3xl font-bold focus:border-emerald-400 outline-none"
            min="0"
            max="100"
            step="0.5"
            disabled={isApproved || isRejected || isLoading}
          />
          <p className="text-xs text-slate-500 mt-1 text-center">Range: 0 - 100</p>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-2 uppercase font-bold">Comments / Feedback</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-black border border-slate-600 p-3 text-white min-h-[120px] focus:border-slate-500 outline-none"
            placeholder="Add feedback for the student..."
            disabled={isApproved || isRejected || isLoading}
          />
        </div>

        {/* Action Buttons */}
        {!isApproved && !isRejected && (
          <div className="space-y-2 pt-4">
            <PixelButton 
              variant="primary" 
              className="w-full"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'SAVING...' : 'SAVE GRADE'}
            </PixelButton>

            <div className="grid grid-cols-2 gap-2">
              <PixelButton 
                variant="success" 
                className="w-full"
                onClick={handleApprove}
                disabled={isLoading}
              >
                <CheckCircle size={16} className="mr-2" />
                APPROVE
              </PixelButton>
              <PixelButton 
                variant="danger" 
                className="w-full"
                onClick={handleReject}
                disabled={isLoading}
              >
                <XCircle size={16} className="mr-2" />
                REJECT
              </PixelButton>
            </div>
          </div>
        )}

        {/* Status Display */}
        {isApproved && (
          <div className="bg-emerald-900/50 border-2 border-emerald-500 p-4 text-center">
            <CheckCircle size={48} className="mx-auto text-emerald-400 mb-2" />
            <p className="text-emerald-400 font-bold text-lg">GRADE APPROVED</p>
            <p className="text-xs text-emerald-300 mt-2">
              {submission.grade.approvedAt && new Date(submission.grade.approvedAt).toLocaleString()}
            </p>
          </div>
        )}

        {isRejected && (
          <div className="bg-rose-900/50 border-2 border-rose-500 p-4 text-center">
            <XCircle size={48} className="mx-auto text-rose-400 mb-2" />
            <p className="text-rose-400 font-bold text-lg">GRADE REJECTED</p>
            <p className="text-xs text-slate-300 mt-2">{submission.grade.notes}</p>
          </div>
        )}
      </div>
    </PixelCard>
  );
}

