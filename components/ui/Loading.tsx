import React from 'react';

interface LoadingProps {
  text?: string;
  fullscreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ text = 'Loading...', fullscreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-400 animate-spin"></div>
      </div>
      <p className="text-sm text-slate-400 uppercase font-bold animate-pulse">{text}</p>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="py-12">{content}</div>;
};

export default Loading;
