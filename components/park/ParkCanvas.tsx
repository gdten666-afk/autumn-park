'use client';

import { useEffect, useRef } from 'react';
import { getSeasonState } from '@/lib/seasons';
import type { SeasonState } from '@/lib/types';

interface ParkCanvasProps {
  children: React.ReactNode;
  onSeasonChange: (state: SeasonState) => void;
}

export default function ParkCanvas({ children, onSeasonChange }: ParkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSeasonChange(getSeasonState());
    const interval = setInterval(() => onSeasonChange(getSeasonState()), 3600000);
    return () => clearInterval(interval);
  }, [onSeasonChange]);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-y-auto overflow-x-hidden relative"
      style={{
        background: 'var(--season-bg)',
        transition: 'background var(--transition-duration) ease',
      }}
    >
      <div className="relative w-full" style={{ minHeight: '200vh' }}>
        {children}
      </div>
    </div>
  );
}
