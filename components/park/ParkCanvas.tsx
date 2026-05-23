'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSeasonState } from '@/lib/seasons';
import type { SeasonState } from '@/lib/types';

interface ParkCanvasProps {
  children: React.ReactNode;
  onSeasonChange: (state: SeasonState) => void;
  onScroll?: (x: number) => void;
}

export default function ParkCanvas({ children, onSeasonChange, onScroll }: ParkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);

  useEffect(() => {
    const state = getSeasonState();
    onSeasonChange(state);

    // Update season every hour
    const interval = setInterval(() => {
      const newState = getSeasonState();
      onSeasonChange(newState);
    }, 3600000);

    return () => clearInterval(interval);
  }, [onSeasonChange]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const x = containerRef.current.scrollLeft;
      setScrollX(x);
      onScroll?.(x);
    }
  }, [onScroll]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="w-full h-screen overflow-x-auto overflow-y-hidden relative"
      style={{
        background: 'var(--season-bg)',
        transition: 'background var(--transition-duration) ease',
      }}
    >
      <div className="relative h-full" style={{ width: '400vw', minWidth: '4000px' }}>
        {children}
      </div>
    </div>
  );
}
