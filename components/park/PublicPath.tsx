'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import type { Photo } from '@/lib/types';
import { QUOTES } from '@/lib/constants';

type FeedItem = { type: 'photo'; data: Photo; idx: number } | { type: 'quote'; text: string; source: string; idx: number };

export default function PublicPath() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [expanded, setExpanded] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'walk' | 'gallery'>('walk');

  const loadPhotos = useCallback(async () => {
    const r = await fetch('/api/photos/public');
    const data = await r.json();
    if (data.ok) setPhotos(data.data);
  }, []);

  useEffect(() => {
    loadPhotos();
    // Listen for new photo uploads
    const handler = () => loadPhotos();
    window.addEventListener('photo-uploaded', handler);
    return () => window.removeEventListener('photo-uploaded', handler);
  }, [loadPhotos]);

  const noPhotos = photos.length === 0;

  // Interleave photos with quotes: every 3-5 photos, insert a quote
  const feedItems = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    let qi = 0;
    for (let i = 0; i < photos.length; i++) {
      items.push({ type: 'photo', data: photos[i], idx: i });
      if ((i + 1) % 4 === 0 && qi < QUOTES.length) {
        items.push({ type: 'quote', text: QUOTES[qi].text, source: QUOTES[qi].source, idx: qi });
        qi++;
      }
    }
    return items;
  }, [photos]);

  return (
    <div className="relative w-full pointer-events-none">
      {/* View mode toggle */}
      <div className="fixed top-20 left-4 z-20 flex gap-1 pointer-events-auto">
        <button onClick={() => setViewMode('walk')} className={`glass-btn ${viewMode === 'walk' ? '!bg-white/80 !text-black/60' : ''}`}>漫步</button>
        <button onClick={() => setViewMode('gallery')} className={`glass-btn ${viewMode === 'gallery' ? '!bg-white/80 !text-black/60' : ''}`}>画廊</button>
        <span className="text-black/20 text-xs self-center ml-3 font-mono">{photos.length}</span>
      </div>

      {noPhotos ? (
        <div className="flex items-center justify-center pointer-events-auto" style={{ minHeight: '60vh' }}>
          <div className="glass-strong p-10 text-center max-w-sm animate-slideUp">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-black/5 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M 21 15 L 16 10 L 5 21" />
              </svg>
            </div>
            <p className="text-black/35 text-base mb-2 font-serif">公园里还没有照片</p>
            <p className="text-black/20 text-xs leading-relaxed">进入你的角落，上传照片并点亮「发布到公园」<br />它们会像记忆碎片一样散落在这片风景里</p>
          </div>
        </div>
      ) : viewMode === 'walk' ? (
        <div className="relative w-full pointer-events-auto" style={{ paddingTop: '12vh', paddingBottom: '20vh', maxWidth: 'min(calc(100vw - 320px), 100%)', width: '100%', paddingLeft: 'clamp(12px, 4vw, 32px)', paddingRight: 'clamp(12px, 4vw, 32px)' }}>
          <div className="flex flex-wrap justify-center gap-5 md:gap-8">
            {feedItems.map((item) => {
              if (item.type === 'quote') {
                return (
                  <div key={`q-${item.idx}`} className="flex items-center justify-center pointer-events-auto"
                    style={{
                      width: 'clamp(140px, 42vw, 260px)',
                      minHeight: '120px',
                      marginTop: (item.idx % 3) * 24,
                      transform: `rotate(${['-1.5deg','1deg','-0.5deg','1.5deg','-1deg','0.5deg'][item.idx % 6]})`,
                    }}>
                    <div className="glass p-5 text-center">
                      <p className="text-black/35 text-sm leading-relaxed font-serif mb-2">「{item.text}」</p>
                      <p className="text-black/15 text-[10px] tracking-wider">—— {item.source}</p>
                    </div>
                  </div>
                );
              }
              const photo = item.data;
              const i = item.idx;
              const rotations = ['-2deg', '1deg', '-1deg', '2deg', '-3deg', '1.5deg', '-1.5deg', '2.5deg'];
              const rotation = rotations[i % rotations.length];
              return (
                <div key={photo.id} className="polaroid-card cursor-pointer group/card"
                  style={{
                    transform: `rotate(${rotation})`,
                    marginTop: (i % 5) * 12,
                    marginLeft: (i % 3) * 20,
                    width: 'clamp(140px, 44vw, 240px)',
                    transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(0deg) scale(1.04)'; e.currentTarget.style.zIndex = '20'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = `rotate(${rotation}deg) scale(1)`; e.currentTarget.style.zIndex = ''; }}
                  onClick={() => setExpanded(photo)}>
                  <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-black/5 shadow-lg" style={{ aspectRatio: '4/5' }}>
                    <img src={`/api/photos/${photo.id}?file=1`} alt={photo.caption || ''} className="w-full h-full object-cover img-loading" loading="lazy" decoding="async"
                      onLoad={e => { (e.target as HTMLImageElement).classList.replace('img-loading', 'img-loaded'); }} />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-2.5">
                      {photo.caption && <p className="text-white/90 text-xs font-serif truncate">{photo.caption}</p>}
                      <p className="text-white/40 text-[10px] mt-0.5">{photo.author_name || 'anonymous'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="relative w-full pointer-events-auto" style={{ paddingTop: '12vh', paddingBottom: '20vh', maxWidth: 'min(calc(100vw - 320px), 100%)', width: '100%', paddingLeft: 'clamp(12px, 4vw, 32px)', paddingRight: 'clamp(12px, 4vw, 32px)' }}>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {photos.map(photo => (
              <div key={photo.id} className="break-inside-avoid mb-4 cursor-pointer group/gallery" onClick={() => setExpanded(photo)}>
                <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-black/5 hover:ring-black/15 transition-all duration-300 hover:shadow-xl">
                  <img src={`/api/photos/${photo.id}?file=1`} alt={photo.caption || ''} className="w-full block img-loading" loading="lazy" decoding="async"
                    onLoad={e => { (e.target as HTMLImageElement).classList.replace('img-loading', 'img-loaded'); }} />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300">
                    {photo.caption && <p className="text-white/90 text-xs font-serif truncate">{photo.caption}</p>}
                    <p className="text-white/50 text-[10px] mt-0.5">{photo.author_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded photo modal */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center pointer-events-auto animate-fadeIn" onClick={() => setExpanded(null)}>
          <div className="flex flex-col items-center max-w-4xl max-h-[92vh] p-6" onClick={e => e.stopPropagation()}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <img src={`/api/photos/${expanded.id}?file=1`} alt={expanded.caption || ''} className="max-w-full max-h-[70vh] object-contain bg-black/40" />
            </div>
            <div className="mt-4 text-center">
              {expanded.caption && <p className="text-white/85 text-lg font-serif mb-1">{expanded.caption}</p>}
              <p className="text-white/30 text-sm">by {expanded.author_name || 'anonymous'}</p>
            </div>
            <button onClick={() => setExpanded(null)} className="glass-btn mt-4 !text-white/60 !bg-white/10 !border-white/10 hover:!bg-white/20">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
