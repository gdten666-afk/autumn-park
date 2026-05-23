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
  // Photo clusters — like natural clearings along the path
  const scatteredPhotos = useMemo(() => {
    // Define clusters as "clearings" along the path
    const clusters = [
      { cx: 6,  cy: 32, spread: 5, count: 5 },   // Near entrance
      { cx: 18, cy: 45, spread: 6, count: 6 },   // By the bench
      { cx: 32, cy: 38, spread: 5, count: 5 },   // Mid park clearing
      { cx: 48, cy: 42, spread: 6, count: 6 },   // Central gathering
      { cx: 64, cy: 36, spread: 5, count: 5 },   // Far clearing
      { cx: 78, cy: 44, spread: 6, count: 5 },   // Deep park
      { cx: 90, cy: 38, spread: 5, count: 5 },   // End of path
    ];

    let photoIndex = 0;
    const totalClusters = clusters.length;

    return photos.map((photo) => {
      // Assign photos to clusters round-robin
      const cluster = clusters[photoIndex % totalClusters];
      const angle = (photoIndex / cluster.count) * Math.PI * 2;
      const radius = (photoIndex % cluster.count) * (cluster.spread / cluster.count);
      const x = cluster.cx + Math.cos(angle) * radius;
      const y = cluster.cy + Math.sin(angle) * radius * 0.6;
      photoIndex++;

      return {
        ...photo,
        x: Math.max(1, Math.min(98, x)),
        y: Math.max(12, Math.min(68, y)),
        rotation: (Math.sin(photoIndex * 2.3) * 5),
        scale: 0.85 + (photoIndex % 3) * 0.1,
        zIndex: 15 + (photoIndex % 15),
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
        <button onClick={() => setViewMode('walk')} className={`glass-btn ${viewMode === 'walk' ? '!bg-white/15 !text-white/90' : ''}`}>
          漫步
        </button>
        <button onClick={() => setViewMode('gallery')} className={`glass-btn ${viewMode === 'gallery' ? '!bg-white/15 !text-white/90' : ''}`}>
          画廊
        </button>
        <span className="text-white/15 text-xs self-center ml-3 font-mono">{photos.length}</span>
      </div>

      {noPhotos ? (
        /* Empty state — inviting and poetic */
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-10" style={{ width: '400vw' }}>
          <div className="glass-strong p-10 text-center max-w-sm animate-slideUp">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M 21 15 L 16 10 L 5 21" />
              </svg>
            </div>
            <p className="text-white/50 text-base mb-2 font-serif">公园里还没有照片</p>
            <p className="text-white/20 text-xs leading-relaxed">
              进入你的角落，上传照片并点亮「发布到公园」<br />
              它们会像记忆碎片一样散落在这片风景里
            </p>
          </div>
        </div>
      ) : viewMode === 'walk' ? (
        /* Walk mode — premium glass photo cards */
        <div className="absolute inset-0" style={{ width: '400vw' }}>
          {scatteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="absolute pointer-events-auto group/card"
              style={{
                left: `${photo.x}%`,
                top: `${photo.y}%`,
                zIndex: photo.zIndex,
              }}
              onClick={() => setExpanded(photo)}
            >
              <div
                className="polaroid-card relative cursor-pointer"
                style={{
                  transform: `rotate(${photo.rotation}deg)`,
                  width: `${120 * photo.scale}px`,
                  transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = `rotate(0deg) scale(1.04)`; e.currentTarget.style.zIndex = '20'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = `rotate(${photo.rotation}deg) scale(1)`; e.currentTarget.style.zIndex = ''; }}
              >
                {/* Photo */}
                <div className="relative overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 shadow-2xl"
                  style={{ aspectRatio: '4/5' }}>
                  <img
                    src={`/api/photos/${photo.id}?file=1`}
                    alt={photo.caption || ''}
                    className="w-full h-full object-cover img-loading"
                    loading="lazy"
                    decoding="async"
                    onLoad={e => { (e.target as HTMLImageElement).classList.replace('img-loading', 'img-loaded'); }}
                  />

                  {/* Gradient overlay at bottom for text */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Caption and author */}
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    {photo.caption && (
                      <p className="text-white/90 text-xs font-serif truncate leading-relaxed">
                        {photo.caption}
                      </p>
                    )}
                    <p className="text-white/35 text-[10px] mt-0.5">
                      {photo.author_name || 'anonymous'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Gallery mode — masonry grid with glass cards */
        <div className="absolute inset-0 pointer-events-auto overflow-y-auto" style={{ width: '100vw', height: '100vh' }}>
          <div className="pt-24 px-4 md:px-8 pb-8">
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
              {photos.map(photo => (
                <div
                  key={photo.id}
                  className="break-inside-avoid mb-4 cursor-pointer group/gallery"
                  onClick={() => setExpanded(photo)}
                >
                  <div className="relative overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/5 hover:ring-white/15 transition-all duration-300 hover:shadow-2xl hover:shadow-black/40">
                    <img
                      src={`/api/photos/${photo.id}?file=1`}
                      alt={photo.caption || ''}
                      className="w-full block img-loading"
                      loading="lazy"
                      decoding="async"
                      onLoad={e => { (e.target as HTMLImageElement).classList.replace('img-loading', 'img-loaded'); }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300">
                      {photo.caption && <p className="text-white/90 text-xs font-serif truncate">{photo.caption}</p>}
                      <p className="text-white/40 text-[10px] mt-0.5">{photo.author_name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expanded photo modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center pointer-events-auto animate-fadeIn"
          onClick={() => setExpanded(null)}
        >
          <div className="flex flex-col items-center max-w-4xl max-h-[92vh] p-6" onClick={e => e.stopPropagation()}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <img
                src={`/api/photos/${expanded.id}?file=1`}
                alt={expanded.caption || ''}
                className="max-w-full max-h-[70vh] object-contain bg-black/40"
              />
            </div>
            <div className="mt-4 text-center">
              {expanded.caption && (
                <p className="text-white/85 text-lg font-serif mb-1">{expanded.caption}</p>
              )}
              <p className="text-white/30 text-sm">by {expanded.author_name || 'anonymous'}</p>
            </div>
            <button
              onClick={() => setExpanded(null)}
              className="glass-btn mt-4"
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
