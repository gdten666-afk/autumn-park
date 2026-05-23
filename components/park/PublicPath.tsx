'use client';

import { useEffect, useState, useMemo } from 'react';
import PhotoFragment from './PhotoFragment';
import type { Photo } from '@/lib/types';

interface DisplayPoint {
  id: string;
  x: number;        // percentage across the park width
  y: number;        // percentage from top
  label: string;
  photos: Photo[];
}

const FIXED_POINTS: Omit<DisplayPoint, 'photos'>[] = [
  { id: 'old-oak',    x: 8,  y: 45, label: '老橡树' },
  { id: 'stone-bench',x: 22, y: 60, label: '石长椅' },
  { id: 'lily-pond',  x: 38, y: 50, label: '睡莲池' },
  { id: 'rose-arch',  x: 52, y: 35, label: '蔷薇拱门' },
  { id: 'maple-grove',x: 68, y: 55, label: '枫树林' },
  { id: 'lamp-post',  x: 82, y: 42, label: '路灯下' },
  { id: 'bridge',     x: 92, y: 48, label: '小石桥' },
];

export default function PublicPath() {
  const [publicPhotos, setPublicPhotos] = useState<Photo[]>([]);
  const [featured, setFeatured] = useState<Photo[]>([]);

  useEffect(() => {
    fetch('/api/photos/public')
      .then(r => r.json())
      .then(data => {
        if (data.ok) setPublicPhotos(data.data);
      });
  }, []);

  // Daily random featured photo
  useMemo(() => {
    if (publicPhotos.length === 0) return;
    const seed = new Date().toISOString().slice(0, 10);
    const shuffled = [...publicPhotos].sort(() => {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      return (Math.abs(hash) % 2) - 0.5;
    });
    setFeatured(shuffled.slice(0, 3));
  }, [publicPhotos]);

  // Distribute photos across fixed points
  const displayPoints = useMemo(() => {
    const remaining = publicPhotos.filter(p => !featured.find(f => f.id === p.id));
    return FIXED_POINTS.map((point, i) => ({
      ...point,
      photos: remaining.filter((_, j) => j % FIXED_POINTS.length === i).slice(0, 4),
    }));
  }, [publicPhotos, featured]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Path SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M 0,50 Q 10,40 20,55 T 40,50 T 60,45 T 80,55 T 100,48"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.3"
          strokeDasharray="1,0.5"
        />
      </svg>

      {/* Fixed display points */}
      {displayPoints.map(point => (
        <div
          key={point.id}
          className="absolute pointer-events-auto cursor-pointer group"
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-xs text-white/60 group-hover:bg-white/20 transition-all">
            📍
          </div>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/40 whitespace-nowrap">
            {point.label}
          </span>
          {/* Photos at this point */}
          {point.photos.map((photo, i) => (
            <PhotoFragment key={photo.id} photo={photo} index={i} />
          ))}
        </div>
      ))}

      {/* Featured daily photos */}
      {featured.map((photo, i) => (
        <div
          key={photo.id}
          className="absolute pointer-events-auto"
          style={{ left: `${25 + i * 28}%`, top: `${20 + (i % 2) * 15}%` }}
        >
          <PhotoFragment photo={photo} index={0} featured />
        </div>
      ))}
    </div>
  );
}
