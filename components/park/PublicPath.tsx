'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Photo } from '@/lib/types';

export default function PublicPath() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [expanded, setExpanded] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'walk' | 'gallery'>('walk');

  useEffect(() => {
    fetch('/api/photos/public')
      .then(r => r.json())
      .then(data => {
        if (data.ok) setPhotos(data.data);
      });
  }, []);

  // Distribute photos across the 400vw park space with natural-looking positions
  const scatteredPhotos = useMemo(() => {
    const seed = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);

    return photos.map((photo, i) => {
      const pseudoRandom = ((hash * (i + 1) * 31 + i * 7) % 10000) / 10000;
      return {
        ...photo,
        // Distribute across 2-95% of park width, varying heights
        x: 2 + (i / Math.max(photos.length, 1)) * 93 + pseudoRandom * 5 - 2.5,
        y: 15 + pseudoRandom * 55, // 15-70% from top
        rotation: (pseudoRandom - 0.5) * 12, // -6 to +6 degrees
        scale: 0.85 + pseudoRandom * 0.3,
        zIndex: Math.floor(pseudoRandom * 10),
      };
    });
  }, [photos]);

  const noPhotos = photos.length === 0;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Path SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none"
        style={{ width: '400vw', height: '100vh' }}>
        <path
          d="M 0,55 C 5,53 8,57 12,55 C 16,53 20,58 25,56 C 30,54 33,52 38,54 C 43,56 48,53 52,55"
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="3,8"
        />
        <path
          d="M 52,55 C 58,57 62,54 66,52 C 70,50 74,55 78,53 C 82,51 86,55 92,53 C 96,51 100,54 100,52"
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="3,8"
        />
      </svg>

      {/* View mode toggle */}
      <div className="fixed top-20 left-4 z-20 flex gap-1 pointer-events-auto">
        <button
          onClick={() => setViewMode('walk')}
          className={`px-3 py-1.5 rounded-full text-xs transition-all ${
            viewMode === 'walk'
              ? 'bg-white/15 text-white/80'
              : 'bg-white/5 text-white/30 hover:bg-white/10'
          }`}
        >
          🚶 漫步
        </button>
        <button
          onClick={() => setViewMode('gallery')}
          className={`px-3 py-1.5 rounded-full text-xs transition-all ${
            viewMode === 'gallery'
              ? 'bg-white/15 text-white/80'
              : 'bg-white/5 text-white/30 hover:bg-white/10'
          }`}
        >
          🖼 画廊
        </button>
        <span className="text-white/15 text-xs self-center ml-2">
          {photos.length} 张照片
        </span>
      </div>

      {noPhotos ? (
        /* Empty state */
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-10">
          <div className="text-center bg-black/30 backdrop-blur rounded-xl p-8 max-w-sm">
            <p className="text-white/40 text-4xl mb-4">🖼</p>
            <p className="text-white/50 text-sm mb-2">公园里还没有照片</p>
            <p className="text-white/25 text-xs leading-relaxed">
              进入你的角落，上传照片并勾选「发布到公园」，
              它们就会出现在这里，成为这片风景的一部分。
            </p>
          </div>
        </div>
      ) : viewMode === 'walk' ? (
        /* Walk mode — photos scattered naturally through the park */
        <div className="absolute inset-0" style={{ width: '400vw' }}>
          {scatteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="absolute pointer-events-auto cursor-pointer group"
              style={{
                left: `${photo.x}%`,
                top: `${photo.y}%`,
                zIndex: photo.zIndex,
              }}
              onClick={() => setExpanded(photo)}
            >
              {/* Polaroid card */}
              <div
                className="relative bg-white/90 backdrop-blur p-1.5 pb-6 rounded-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                style={{
                  transform: `rotate(${photo.rotation}deg)`,
                  width: `${100 * photo.scale}px`,
                }}
              >
                <div className="w-full overflow-hidden rounded-sm" style={{ aspectRatio: '1' }}>
                  <img
                    src={`/api/photos/${photo.id}?file=1`}
                    alt={photo.caption || 'photo'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {photo.caption && (
                  <p className="text-gray-600 text-[10px] mt-1 text-center truncate px-1 font-serif italic">
                    {photo.caption}
                  </p>
                )}
                <p className="text-gray-300 text-[8px] text-center mt-0.5 truncate">
                  {photo.author_name || 'anonymous'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Gallery mode — clean grid */
        <div className="absolute inset-0 pointer-events-auto overflow-y-auto" style={{ width: '100vw', height: '100vh' }}>
          <div className="pt-20 px-4 pb-8 columns-2 md:columns-3 lg:columns-4 gap-3">
            {photos.map(photo => (
              <div
                key={photo.id}
                className="break-inside-avoid mb-3 cursor-pointer group"
                onClick={() => setExpanded(photo)}
              >
                <div className="relative overflow-hidden rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <img
                    src={`/api/photos/${photo.id}?file=1`}
                    alt={photo.caption || ''}
                    className="w-full block"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.caption && <p className="text-white/90 text-xs truncate">{photo.caption}</p>}
                    <p className="text-white/50 text-[10px]">{photo.author_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded photo modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center pointer-events-auto"
          onClick={() => setExpanded(null)}
        >
          <div className="max-w-3xl max-h-[90vh] p-4" onClick={e => e.stopPropagation()}>
            <img
              src={`/api/photos/${expanded.id}?file=1`}
              alt={expanded.caption || ''}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
            {expanded.caption && (
              <p className="text-white/80 text-center mt-3 text-lg font-serif">{expanded.caption}</p>
            )}
            <p className="text-white/40 text-center text-sm mt-1">
              by {expanded.author_name || 'anonymous'}
            </p>
            <button
              onClick={() => setExpanded(null)}
              className="block mx-auto mt-4 px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white/60 text-sm transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Keep PhotoFragment export for any remaining consumers
import type { Photo as PhotoType } from '@/lib/types';
export function PhotoFragment({ photo, index, featured }: { photo: PhotoType; index: number; featured?: boolean }) {
  return null; // Deprecated, photos now render directly in PublicPath
}
