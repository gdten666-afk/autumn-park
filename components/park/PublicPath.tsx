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
    const t = setTimeout(loadPhotos, 0);
    const handler = () => loadPhotos();
    window.addEventListener('photo-uploaded', handler);
    return () => { clearTimeout(t); window.removeEventListener('photo-uploaded', handler); };
  }, [loadPhotos]);

  const noPhotos = photos.length === 0;

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
      <div className="fixed top-16 right-4 md:right-[296px] z-20 flex items-center gap-1 pointer-events-auto max-md:top-14 max-md:right-2"
        style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 999, padding: 4, boxShadow: 'var(--shadow-card)' }}>
        {(['walk', 'gallery'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="px-3 py-1 text-[11px] rounded-full transition-colors"
            style={{
              color: viewMode === mode ? 'var(--ink)' : 'var(--ink-faint)',
              background: viewMode === mode ? 'var(--bg-soft)' : 'transparent',
              letterSpacing: '0.08em',
            }}
          >
            {mode === 'walk' ? '漫步' : '画廊'}
          </button>
        ))}
        <span className="pl-2 pr-1 text-[10px] font-mono" style={{ color: 'var(--ink-weak)' }}>{photos.length}</span>
      </div>

      {noPhotos ? (
        <div className="flex items-center justify-center pointer-events-auto" style={{ minHeight: '60vh' }}>
          <div className="glass-strong p-10 text-center max-w-sm animate-slideUp">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--bg-soft)] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(45,42,36,0.3)" strokeWidth="1.2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M 21 15 L 16 10 L 5 21" />
              </svg>
            </div>
            <p className="text-[var(--ink-soft)] text-base mb-2 font-serif">公园里还没有照片</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-faint)' }}>进入你的角落，上传照片并点亮「发布到公园」<br />它们会像记忆碎片一样散落在这片风景里</p>
          </div>
        </div>
      ) : viewMode === 'walk' ? (
        <div className="reveal relative w-full pointer-events-auto md:max-w-[calc(100vw-320px)]" style={{ paddingTop: '12vh', paddingBottom: '20vh', width: '100%', paddingLeft: 'clamp(8px, 3vw, 32px)', paddingRight: 'clamp(8px, 3vw, 32px)' }}>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {feedItems.map((item) => {
              if (item.type === 'quote') {
                return (
                  <div key={`q-${item.idx}`} className="flex items-center justify-center pointer-events-auto"
                    style={{ width: 'clamp(200px, 85vw, 300px)' }}>
                    <div className="glass px-5 py-6 text-center w-full">
                      <p className="text-[var(--ink-soft)] text-sm leading-relaxed font-serif mb-2">「{item.text}」</p>
                      <p className="text-[10px] tracking-wider" style={{ color: 'var(--ink-faint)' }}>—— {item.source}</p>
                    </div>
                  </div>
                );
              }
              const photo = item.data;
              return (
                <div key={photo.id} className="polaroid-card cursor-pointer group/card"
                  style={{ width: 'clamp(220px, 82vw, 300px)' }}
                  onClick={() => setExpanded(photo)}>
                  <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--hairline)] shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-lift)] transition-shadow duration-300">
                    <div className="overflow-hidden" style={{ aspectRatio: '4/3' }}>
                      <img src={`/api/photos/${photo.id}?thumb=1`} alt={photo.caption || 'photo'} className="w-full h-full object-cover img-loading transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" decoding="async"
                        onLoad={e => { (e.target as HTMLImageElement).classList.replace('img-loading', 'img-loaded'); }} />
                    </div>
                    <div className="px-3 py-2.5">
                      {photo.caption && (
                        <p className="text-[var(--ink)] text-xs font-serif leading-relaxed line-clamp-2">{photo.caption}</p>
                      )}
                      <p className="text-[var(--ink-weak)] text-[10px] mt-1">{photo.author_name || 'anonymous'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="relative w-full pointer-events-auto md:max-w-[calc(100vw-320px)]" style={{ paddingTop: '12vh', paddingBottom: '20vh', width: '100%', paddingLeft: 'clamp(12px, 4vw, 32px)', paddingRight: 'clamp(12px, 4vw, 32px)' }}>
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
            {photos.map(photo => (
              <div key={photo.id} className="break-inside-avoid mb-4 cursor-pointer group/gallery" onClick={() => setExpanded(photo)}>
                <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--hairline)] hover:ring-[var(--hairline-strong)] transition-all duration-300 hover:shadow-[var(--shadow-lift)]">
                  <img src={`/api/photos/${photo.id}?thumb=1`} alt={photo.caption || 'photo'} className="w-full block img-loading" loading="lazy" decoding="async"
                    onLoad={e => { (e.target as HTMLImageElement).classList.replace('img-loading', 'img-loaded'); }} />
                  <div className="px-3 py-2.5">
                    {photo.caption && <p className="text-[var(--ink)] text-xs font-serif leading-relaxed line-clamp-2">{photo.caption}</p>}
                    <p className="text-[var(--ink-weak)] text-[10px] mt-0.5">{photo.author_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded photo modal */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-[var(--bg)]/97 flex items-center justify-center pointer-events-auto animate-fadeIn" onClick={() => setExpanded(null)}>
          <button onClick={() => setExpanded(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--hairline)] hover:bg-[var(--bg-soft)] flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <button onClick={async () => {
            try { const r = await fetch(`/api/photos/${expanded.id}?file=1`); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = expanded.filename || 'photo.jpg'; a.click(); URL.revokeObjectURL(u); } catch {}
          }}
            className="absolute top-4 right-16 z-10 w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--hairline)] hover:bg-[var(--bg-soft)] flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
            title="下载">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <div className="flex flex-col items-center max-w-4xl max-h-[92vh] p-6" onClick={e => e.stopPropagation()}>
            <div className="relative rounded-2xl overflow-hidden shadow-[var(--shadow-lift)] ring-1 ring-[var(--hairline)]">
              <img src={`/api/photos/${expanded.id}?medium=1`} alt={expanded.caption || 'photo'} className="max-w-full max-h-[70vh] object-contain bg-[var(--surface)]" />
            </div>
            <div className="mt-4 text-center">
              {expanded.caption && <p className="text-[var(--ink)] text-lg font-serif mb-1">{expanded.caption}</p>}
              <p className="text-[var(--ink-faint)] text-sm">by {expanded.author_name || 'anonymous'}</p>
            </div>
            <button onClick={() => setExpanded(null)} className="glass-btn mt-4">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
