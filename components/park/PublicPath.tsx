'use client';

import { useEffect, useState, useMemo } from 'react';
import PhotoFragment from './PhotoFragment';
import type { Photo } from '@/lib/types';

interface DisplayPoint {
  id: string;
  x: number;
  y: number;
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
  const [selectedPoint, setSelectedPoint] = useState<DisplayPoint | null>(null);

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
          <button
            onClick={() => setSelectedPoint(point)}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-sm text-white/60 group-hover:bg-white/25 group-hover:scale-110 transition-all"
            title={point.label}
          >
            {point.photos.length > 0 ? '🖼' : '📍'}
          </button>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/40 whitespace-nowrap">
            {point.label}
          </span>
          {/* Photos orbiting around the point */}
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

      {/* Point popup panel */}
      {selectedPoint && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center pointer-events-auto"
          onClick={() => setSelectedPoint(null)}
        >
          <div
            className="bg-[#2c1810] border border-white/10 rounded-xl p-5 w-80 max-w-[90vw] max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white/80 text-lg mb-1">{selectedPoint.label}</h3>
            <p className="text-white/30 text-xs mb-4">
              {selectedPoint.photos.length > 0
                ? `${selectedPoint.photos.length} 张照片`
                : '这里还没有照片，上传一些照片并设为公开吧'}
            </p>

            {selectedPoint.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selectedPoint.photos.map(photo => (
                  <img
                    key={photo.id}
                    src={`/api/photos/${photo.id}?file=1`}
                    alt={photo.caption || ''}
                    className="w-full aspect-square object-cover rounded cursor-pointer hover:scale-105 transition-transform"
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => setSelectedPoint(null)}
              className="mt-4 w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-sm text-white/40 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
