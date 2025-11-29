'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  endTime: Date | null;
  onComplete?: () => void;
  className?: string;
}

const Timer: React.FC<TimerProps> = ({ endTime, onComplete, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      return diff;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);

      if (left === 0 && onComplete) {
        onComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft > 0 && timeLeft <= 60;
  const isDanger = timeLeft > 0 && timeLeft <= 30;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock
        size={20}
        className={`${
          isDanger ? 'text-rose-500' : isWarning ? 'text-amber-400' : 'text-slate-400'
        }`}
      />
      <div
        className={`text-2xl font-bold font-mono ${
          isDanger ? 'text-rose-500 blink' : isWarning ? 'text-amber-400' : 'text-white'
        }`}
      >
        {formatTime(timeLeft)}
      </div>
    </div>
  );
};

export default Timer;
