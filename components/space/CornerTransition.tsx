// components/space/CornerTransition.tsx
'use client';

import { useEffect } from 'react';

interface CornerTransitionProps {
  onEntered: () => void;
  isEntering: boolean;
  ownerName: string;
}

export default function CornerTransition({ onEntered, isEntering, ownerName }: CornerTransitionProps) {
  useEffect(() => {
    if (!isEntering) return;
    const t = setTimeout(onEntered, 1500);
    return () => clearTimeout(t);
  }, [isEntering, onEntered]);

  return (
    <div
      className={`corner-overlay fixed inset-0 z-40 flex items-center justify-center pointer-events-none ${isEntering ? 'corner-overlay--enter' : ''}`}
      style={{ background: 'var(--bg)' }}
    >
      <div className="text-center">
        <div className={`corner-rule ${isEntering ? 'corner-rule--enter' : ''}`} />
        <p className={`corner-caption ${isEntering ? 'corner-caption--enter' : ''}`}>走进 {ownerName} 的角落</p>
      </div>
    </div>
  );
}
