'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Photo } from '@/lib/types';

interface Comment {
  id: string;
  photo_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string;
}

interface PhotoModalProps {
  photos: Photo[];
  index: number;
  isOwner: boolean;
  editingId: string | null;
  editValue: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onStartEdit: (photo: Photo) => void;
  onSaveCaption: (photoId: string) => void;
  onEditValueChange: (v: string) => void;
  onCancelEdit: () => void;
}

export default function PhotoModal({
  photos, index, isOwner,
  editingId, editValue,
  onClose, onPrev, onNext,
  onStartEdit, onSaveCaption, onEditValueChange, onCancelEdit,
}: PhotoModalProps) {
  const photo = photos[index];
  const [zoom, setZoom] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentPosting, setCommentPosting] = useState(false);
  const [commentError, setCommentError] = useState('');

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments/${photo.id}`);
      const d = await res.json();
      if (d.ok) setComments(d.data);
    } catch {}
  }, [photo.id]);

  useEffect(() => {
    // 延后一帧再发起请求，避免在 effect 体内同步触发 setState（react-hooks 规则）
    const t = setTimeout(loadComments, 0);
    return () => clearTimeout(t);
  }, [loadComments]);

  const postComment = async () => {
    if (!commentText.trim()) return;
    setCommentPosting(true); setCommentError('');
    try {
      const res = await fetch(`/api/comments/${photo.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const d = await res.json();
      if (d.ok) { setComments(prev => [...prev, d.data]); setCommentText(''); }
      else setCommentError(d.error || '发送失败');
    } catch { setCommentError('网络错误'); }
    setCommentPosting(false);
  };

  const deleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${photo.id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      const d = await res.json();
      if (d.ok) setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {}
  };

  // Touch/swipe handling
  const touchStart = useRef<{ x: number; y: number; dist: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStart.current = { x: 0, y: 0, dist: Math.sqrt(dx*dx + dy*dy) };
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    if (zoom > 1) { touchStart.current = null; return; } // don't swipe when zoomed
    const dx = (e.changedTouches[0]?.clientX || 0) - touchStart.current.x;
    if (dx < -60) onNext();
    else if (dx > 60) onPrev();
    touchStart.current = null;
  }, [zoom, onNext, onPrev]);

  // Pinch zoom
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStart.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (touchStart.current.dist > 0) {
        const scale = dist / touchStart.current.dist;
        setZoom(Math.min(4, Math.max(0.5, scale)));
      }
    }
  }, []);

  // Double-click to zoom
  const handleDoubleClick = useCallback(() => {
    setZoom(z => z > 1.5 ? 1 : 2.5);
  }, []);

  // Download
  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(`/api/photos/${photo.id}?file=1`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = photo.filename || 'photo.jpg'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, [photo]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <span className="text-white/30 text-xs">{index + 1} / {photos.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            title="下载照片">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button onClick={() => setZoom(z => z > 1.5 ? 1 : z + 0.5)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white text-xs transition-colors"
            title="缩放">
            {zoom > 1 ? `${Math.round(zoom * 100)}%` : '1:1'}
          </button>
        </div>
      </div>

      {/* Nav arrows */}
      {index > 0 && (
        <button onClick={e => { e.stopPropagation(); onPrev(); }}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors max-md:w-8 max-md:h-8">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}
      {index < photos.length - 1 && (
        <button onClick={e => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors max-md:w-8 max-md:h-8">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}

      {/* Image area */}
      <div
        className="flex flex-col items-center max-w-5xl max-h-[92vh] w-full px-4 select-none"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onDoubleClick={handleDoubleClick}
      >
        <div className="relative overflow-hidden" style={{ maxHeight: '70vh' }}>
          {/* Thumbnail shown instantly (already cached from grid) */}
          <img
            src={`/api/photos/${photo.id}?thumb=1`}
            alt=""
            className="absolute inset-0 max-w-full max-h-[70vh] object-contain"
            style={{ transform: `scale(${zoom})`, filter: 'blur(20px) scale(1.1)', opacity: 0.6 }}
            draggable={false}
          />
          {/* Full image with medium size (1200px) — faster than original */}
          <img
            ref={imageRef}
            src={`/api/photos/${photo.id}?medium=1`}
            alt={photo.caption || 'photo'}
            className="relative max-w-full max-h-[70vh] object-contain transition-opacity duration-500"
            style={{ transform: `scale(${zoom})`, cursor: zoom > 1 ? 'grab' : 'default', opacity: 1 }}
            draggable={false}
            onLoad={e => {
              const el = e.target as HTMLImageElement;
              const prev = el.previousElementSibling as HTMLImageElement;
              if (prev) prev.style.opacity = '0';
            }}
          />
        </div>

        {/* Caption & info */}
        <div className="mt-4 text-center w-full max-w-lg">
          {photo.caption ? (
            isOwner && editingId === photo.id ? (
              <div className="flex items-center gap-2">
                <input type="text" value={editValue} onChange={e => onEditValueChange(e.target.value)}
                  maxLength={100} autoFocus
                  onKeyDown={e => { if (e.key==='Enter') onSaveCaption(photo.id); if (e.key==='Escape') onCancelEdit(); }}
                  className="flex-1 bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white/90 placeholder:text-white/25 outline-none focus:border-white/30 text-center" />
                <button onClick={() => onSaveCaption(photo.id)}
                  className="text-xs px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white/80 transition-colors flex-shrink-0">保存</button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <p className="text-white/85 text-base font-serif">{photo.caption}</p>
                {isOwner && (
                  <button onClick={() => onStartEdit(photo)}
                    className="text-white/30 hover:text-white/60 text-xs transition-colors" title="编辑文案">✎</button>
                )}
              </div>
            )
          ) : (
            isOwner && (
              <button onClick={() => onStartEdit(photo)}
                className="text-white/25 hover:text-white/50 text-xs transition-colors">+ 添加文案</button>
            )
          )}
          <p className="text-white/20 text-xs mt-1.5">
            {photo.is_public && <span className="mr-2">公园可见</span>}
          </p>

          {/* Comments section */}
          <div className="mt-4 pt-4 border-t border-white/10 text-left w-full max-w-lg max-h-[25vh] flex flex-col">
            {/* Comment list */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {comments.length === 0 && (
                <p className="text-white/15 text-[10px] text-center">还没有评论</p>
              )}
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-2 group">
                  <p className="text-white/30 text-[10px] flex-shrink-0 mt-0.5 w-14 truncate text-right">{c.author_name}</p>
                  <p className="text-white/60 text-xs flex-1 leading-relaxed">{c.content}</p>
                  {c.user_id === photo.user_id && (
                    <button onClick={() => deleteComment(c.id)}
                      className="text-white/10 hover:text-red-400/60 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Comment input */}
            <div className="flex gap-2">
              <input
                type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder="说点什么…" maxLength={300}
                onKeyDown={e => { if (e.key === 'Enter') postComment(); }}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-white/20"
              />
              <button onClick={postComment} disabled={commentPosting || !commentText.trim()}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 disabled:opacity-30 transition-colors flex-shrink-0">
                {commentPosting ? '…' : '发送'}
              </button>
            </div>
            {commentError && <p className="text-red-400/50 text-[10px] mt-1">{commentError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
