import React from 'react';

interface PixelCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  color?: string;
}

const PixelCard: React.FC<PixelCardProps> = ({
  title,
  children,
  className = '',
  color = 'bg-slate-800',
}) => {
  return (
    <div className={`pixel-card ${color} ${className}`}>
      {title && (
        <div className="absolute -top-5 left-2 bg-black text-white px-2 py-1 text-xs font-bold border-2 border-white">
          {title}
        </div>
      )}
      {children}
    </div>
  );
};

export default PixelCard;
