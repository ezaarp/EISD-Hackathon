import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatusBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  icon?: LucideIcon;
  showValues?: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({
  label,
  current,
  max,
  color,
  icon: Icon,
  showValues = true,
}) => {
  const percent = Math.min((current / max) * 100, 100);

  return (
    <div className="flex items-center gap-2 w-full mb-2">
      {Icon && (
        <div className="w-8 flex justify-center">
          <Icon size={16} className={color.replace('bg-', 'text-')} />
        </div>
      )}
      <div className="flex-1">
        {showValues && (
          <div className="flex justify-between text-[10px] mb-1 uppercase font-bold text-slate-400">
            <span>{label}</span>
            <span>
              {current}/{max}
            </span>
          </div>
        )}
        <div className="pixel-progress">
          <div
            className={`pixel-progress-bar ${color}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
