// components/space/PhotoWall.tsx
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [makePublic, setMakePublic] = useState(true);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    fetch(`/api/photos/user/${userId}`)
      .then(r => r.json())
      .then(data => { if (data.ok) setPhotos(data.data); });
  }, [userId]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError('');
    let ok = 0;
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      formData.append('isPublic', makePublic ? 'true' : 'false');
      formData.append('caption', caption);
      const res = await fetch('/api/photos/upload', { method: 'POST', body: formData });
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

  const handleDelete = useCallback(async (photoId: string) => {
    const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    }
  }, []);

  const gridClass = scene === 'starlit-camp'
    ? 'flex flex-wrap justify-center gap-6 items-center'
    : 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3';

  return (
    <div className="p-6">
      {isOwner && (
        <div className="mb-4 space-y-2">
          <input type="text" placeholder="照片文案（可选）" value={caption} onChange={e => setCaption(e.target.value)}
            className="glass-input text-xs" maxLength={100} />
          <div className="flex items-center gap-2 flex-wrap">
            <label className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 rounded cursor-pointer text-sm text-white/80 transition-colors">
              {uploading ? '上传中...' : '+ 添加照片'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" disabled={uploading} multiple />
            </label>
            <label className="inline-flex items-center gap-1 text-xs text-white/40 cursor-pointer">
              <input type="checkbox" checked={makePublic} onChange={e => setMakePublic(e.target.checked)} className="accent-amber-500" />
              发布到公园
            </label>
          </div>
          {uploadError && <p className="text-red-400 text-xs mt-1">{uploadError}</p>}
        </div>
      )}

      <div className={gridClass}>
        {photos.map(photo => (
          <div key={photo.id} className="relative group">
            <img
              src={`/api/photos/${photo.id}?file=1`}
              alt={photo.caption || ''}
              className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform border border-white/20"
              onClick={() => setExpandedId(expandedId === photo.id ? null : photo.id)}
            />

            {isOwner && (
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => handleTogglePublic(photo)}
                  className={`text-xs px-1.5 py-0.5 rounded ${photo.is_public ? 'bg-green-500/80' : 'bg-white/20'} text-white`}
                  title={photo.is_public ? '公开' : '仅自己'}
                >
                  {photo.is_public ? '🌐' : '🔒'}
                </button>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="text-xs px-1.5 py-0.5 rounded bg-red-500/60 text-white"
                  title="删除"
                >
                  ✕
                </button>
              </div>
            )}

            {photo.is_public && !isOwner && (
              <span className="absolute top-1 right-1 text-[10px] bg-green-500/60 text-white px-1 rounded">公园可见</span>
            )}

            {expandedId === photo.id && (
              <div
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
                onClick={() => setExpandedId(null)}
              >
                <div className="max-w-3xl max-h-[85vh]" onClick={e => e.stopPropagation()}>
                  <img
                    src={`/api/photos/${photo.id}?file=1`}
                    alt={photo.caption || ''}
                    className="max-w-full max-h-[75vh] object-contain rounded-lg"
                  />
                  {photo.caption && <p className="text-white/80 text-center mt-3">{photo.caption}</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
