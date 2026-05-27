'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Photo } from '@/lib/types';

interface PhotoWallProps {
  userId: string;
  isOwner: boolean;
  scene: string;
}

export default function PhotoWall({ userId, isOwner, scene }: PhotoWallProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [makePublic, setMakePublic] = useState(true);
  const [caption, setCaption] = useState('');

  // Detail modal
  const [detailIdx, setDetailIdx] = useState<number | null>(null);
  // Inline caption editing: photoId -> editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetch(`/api/photos/user/${userId}`)
      .then(r => r.json())
      .then(data => { if (data.ok) setPhotos(data.data); });
  }, [userId]);

  // --- Upload ---
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError('');
    let ok = 0;
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append('file', files[i]);
      fd.append('isPublic', makePublic ? 'true' : 'false');
      fd.append('caption', caption);
      const res = await fetch('/api/photos/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) {
        setPhotos(prev => [data.data, ...prev]);
        ok++;
      } else if (files.length === 1) {
        setUploadError(data.error || '上传失败');
      }
    }
    if (ok > 0) { window.dispatchEvent(new CustomEvent('photo-uploaded')); setCaption(''); }
    if (files.length > 1 && ok < files.length) setUploadError(`${ok}/${files.length} 张上传成功`);
    setUploading(false);
    if (e.target) e.target.value = '';
  }, [makePublic, caption]);

  // --- Toggle public ---
  const handleTogglePublic = useCallback(async (photo: Photo) => {
    const res = await fetch(`/api/photos/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !photo.is_public }),
    });
    const data = await res.json();
    if (data.ok) {
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, is_public: !p.is_public } : p));
    }
  }, []);

  // --- Delete ---
  const handleDelete = useCallback(async (photoId: string) => {
    if (!confirm('删除这张照片？')) return;
    const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      if (detailIdx !== null && photos[detailIdx]?.id === photoId) setDetailIdx(null);
    }
  }, [photos, detailIdx]);

  // --- Save caption (inline edit) ---
  const saveCaption = useCallback(async (photoId: string) => {
    const val = editValue.trim();
    const res = await fetch(`/api/photos/${photoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: val }),
    });
    const data = await res.json();
    if (data.ok) {
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption: val } : p));
    }
    setEditingId(null);
    setEditValue('');
  }, [editValue]);

  const startEdit = (photo: Photo) => {
    setEditingId(photo.id);
    setEditValue(photo.caption || '');
  };

  // --- Keyboard nav for detail modal ---
  useEffect(() => {
    if (detailIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailIdx(null);
      if (e.key === 'ArrowLeft' && detailIdx > 0) setDetailIdx(detailIdx - 1);
      if (e.key === 'ArrowRight' && detailIdx < photos.length - 1) setDetailIdx(detailIdx + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [detailIdx, photos.length]);

  // --- Grid class ---
  const gridClass = scene === 'starlit-camp'
    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
    : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3';

  // --- Empty state ---
  if (photos.length === 0 && !isOwner) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M 21 15 L 16 10 L 5 21" />
            </svg>
          </div>
          <p className="text-white/20 text-sm">这里还没有照片</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* === Upload area === */}
      {isOwner && (
        <div className="mb-6">
          <div className="flex items-end gap-3 flex-wrap">
            {/* Caption input */}
            <div className="flex-1 min-w-[160px]">
              <input
                type="text"
                placeholder="写一句文案描述这张照片…"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                maxLength={100}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-white/20 transition-colors"
              />
            </div>

            {/* Upload button */}
            <label className={`
              inline-flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer text-sm font-medium
              transition-all select-none
              ${uploading
                ? 'bg-white/10 text-white/30 cursor-wait'
                : 'bg-white/10 hover:bg-white/20 text-white/80 active:scale-95'
              }
            `}>
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white/60 rounded-full animate-spin" />
                  上传中…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  添加照片
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
                multiple
              />
            </label>

            {/* Public toggle */}
            <label className="inline-flex items-center gap-2 text-xs text-white/30 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={makePublic}
                onChange={e => setMakePublic(e.target.checked)}
                className="accent-amber-500 w-3.5 h-3.5"
              />
              发布到公园
            </label>
          </div>

          {/* Caption hint */}
          {!caption && !uploading && (
            <p className="text-white/15 text-[11px] mt-2">文案会在照片上显示，上传后也可以随时修改</p>
          )}

          {uploadError && (
            <p className="text-red-400/70 text-xs mt-2">{uploadError}</p>
          )}
        </div>
      )}

      {/* === Photo grid === */}
      <div className={gridClass}>
        {photos.map((photo, idx) => {
          const isEditing = editingId === photo.id;
          return (
            <div key={photo.id} className="relative group">
              {/* Card */}
              <div
                className="relative overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 cursor-pointer
                  transition-all duration-300 hover:ring-white/25 hover:shadow-lg hover:shadow-black/20
                  active:scale-[0.98]"
                style={{ aspectRatio: '1' }}
                onClick={() => setDetailIdx(idx)}
              >
                <img
                  src={`/api/photos/${photo.id}?file=1`}
                  alt={photo.caption || 'photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Caption overlay at bottom */}
                {photo.caption && !isEditing && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent p-3 pt-8">
                    <p className="text-white/90 text-xs leading-relaxed line-clamp-2">{photo.caption}</p>
                  </div>
                )}

                {/* Public badge */}
                {photo.is_public && (
                  <span className="absolute top-2 right-2 text-[9px] bg-black/40 backdrop-blur text-white/50 px-1.5 py-0.5 rounded-full">
                    公园
                  </span>
                )}
              </div>

              {/* Hover action buttons (owner only) */}
              {isOwner && (
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(photo); }}
                    className="text-[10px] px-2 py-1 rounded-md bg-black/50 backdrop-blur text-white/70 hover:text-white hover:bg-black/60 transition-colors"
                    title="编辑文案"
                  >
                    ✎ 文案
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleTogglePublic(photo); }}
                    className={`text-[10px] px-2 py-1 rounded-md backdrop-blur transition-colors ${
                      photo.is_public ? 'bg-green-500/50 text-white/80 hover:bg-green-500/60' : 'bg-black/40 text-white/50 hover:bg-black/50'
                    }`}
                    title={photo.is_public ? '公园可见' : '仅自己可见'}
                  >
                    {photo.is_public ? '🌐' : '🔒'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                    className="text-[10px] px-2 py-1 rounded-md bg-red-500/40 backdrop-blur text-white/70 hover:text-white hover:bg-red-500/50 transition-colors"
                    title="删除"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Inline caption editor */}
              {isEditing && (
                <div
                  className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur p-3"
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    maxLength={100}
                    placeholder="写一句文案…"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveCaption(photo.id);
                      if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
                    }}
                    className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white/90 placeholder:text-white/25 outline-none focus:border-white/30"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => { setEditingId(null); setEditValue(''); }}
                      className="text-[10px] text-white/30 hover:text-white/50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => saveCaption(photo.id)}
                      className="text-[10px] px-3 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white/80 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty: owner hasn't uploaded yet */}
        {photos.length === 0 && isOwner && (
          <div className="col-span-full flex items-center justify-center py-16">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/5 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M 21 15 L 16 10 L 5 21" />
                </svg>
              </div>
              <p className="text-white/30 text-sm mb-1">还没有照片</p>
              <p className="text-white/15 text-xs leading-relaxed">
                点击上方「添加照片」按钮上传你的第一张照片
                <br />可以配上文案，点亮「发布到公园」分享给大家
              </p>
            </div>
          </div>
        )}
      </div>

      {/* === Detail modal === */}
      {detailIdx !== null && photos[detailIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center animate-fadeIn"
          onClick={() => setDetailIdx(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setDetailIdx(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Nav arrows */}
          {detailIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setDetailIdx(detailIdx - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}
          {detailIdx < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setDetailIdx(detailIdx + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}

          <div
            className="flex flex-col items-center max-w-4xl max-h-[92vh] w-full px-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 max-h-[70vh]">
              <img
                src={`/api/photos/${photos[detailIdx].id}?file=1`}
                alt={photos[detailIdx].caption || 'photo'}
                className="max-w-full max-h-[70vh] object-contain bg-black/40"
              />
            </div>

            {/* Caption & info */}
            <div className="mt-4 text-center w-full max-w-lg">
              {photos[detailIdx].caption ? (
                isOwner && editingId === photos[detailIdx].id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      maxLength={100}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveCaption(photos[detailIdx].id);
                        if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
                      }}
                      className="flex-1 bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white/90 placeholder:text-white/25 outline-none focus:border-white/30 text-center"
                    />
                    <button onClick={() => saveCaption(photos[detailIdx].id)}
                      className="text-xs px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white/80 transition-colors flex-shrink-0">
                      保存
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-white/80 text-base font-serif">{photos[detailIdx].caption}</p>
                    {isOwner && (
                      <button
                        onClick={() => startEdit(photos[detailIdx])}
                        className="text-white/25 hover:text-white/50 text-xs transition-colors"
                        title="编辑文案"
                      >
                        ✎
                      </button>
                    )}
                  </div>
                )
              ) : (
                isOwner && (
                  <button
                    onClick={() => startEdit(photos[detailIdx])}
                    className="text-white/20 hover:text-white/40 text-xs transition-colors"
                  >
                    + 添加文案
                  </button>
                )
              )}

              <p className="text-white/20 text-xs mt-2">
                {detailIdx + 1} / {photos.length}
                {photos[detailIdx].is_public && <span className="ml-2 text-white/15">· 公园可见</span>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
