'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PixelButton from './PixelButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PresentationViewerProps {
  liveSessionId: string;
  presentationUrl: string;
  isController?: boolean;
  initialSlide?: number;
}

export default function PresentationViewer({ 
  liveSessionId, 
  presentationUrl, 
  isController = false,
  initialSlide = 1 
}: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);

  useEffect(() => {
    if (isController) return; // Controller doesn't listen, it broadcasts

    const channel = supabase.channel(`live-${liveSessionId}`)
      .on('broadcast', { event: 'slide_change' }, (payload) => {
        console.log('Slide change:', payload);
        setCurrentSlide(payload.payload.slide);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveSessionId, isController]);

  const handleSlideChange = async (newSlide: number) => {
    if (!isController) return;

    setCurrentSlide(newSlide);
    
    // Update database and broadcast
    await fetch('/api/change-slide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        liveSessionId,
        slideNumber: newSlide
      })
    });
  };

  return (
    <div className="space-y-4">
      {/* PDF Viewer */}
      <div className="w-full aspect-[16/9] bg-slate-950 border-2 border-slate-700 overflow-hidden relative">
        <iframe 
          src={`${presentationUrl}#page=${currentSlide}`}
          className="w-full h-full"
          title="Presentation Viewer"
        />
      </div>

      {/* Controller */}
      {isController && (
        <div className="flex items-center justify-between bg-slate-800 border-2 border-slate-700 p-4">
          <PixelButton 
            variant="outline"
            onClick={() => handleSlideChange(Math.max(1, currentSlide - 1))}
            disabled={currentSlide <= 1}
          >
            <ChevronLeft size={20} className="mr-2" />
            PREV
          </PixelButton>

          <div className="text-center">
            <p className="font-pixel text-2xl text-white">{currentSlide}</p>
            <p className="text-xs text-slate-400">Slide Number</p>
          </div>

          <PixelButton 
            variant="outline"
            onClick={() => handleSlideChange(currentSlide + 1)}
          >
            NEXT
            <ChevronRight size={20} className="ml-2" />
          </PixelButton>
        </div>
      )}

      {/* Student View - Just show slide number */}
      {!isController && (
        <div className="text-center bg-slate-800 border border-slate-700 p-2">
          <p className="text-sm text-slate-400">Slide <span className="font-bold text-white">{currentSlide}</span></p>
        </div>
      )}
    </div>
  );
}

