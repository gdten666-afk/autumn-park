'use client';

import { useState, useEffect, useCallback } from 'react';
import SceneFrame from './SceneFrame';
import WeatherPicker from './WeatherPicker';
import ScenePicker from './ScenePicker';
import PhotoWall from './PhotoWall';
import AmbientSound from '@/components/park/AmbientSound';
import type { Space } from '@/lib/types';

interface SpaceWithProfile extends Space {
  display_name?: string;
  bio?: string;
}

interface CornerViewProps {
  userId: string;
  isOwner: boolean;
  onExit: () => void;
}

export default function CornerView({ userId, isOwner, onExit }: CornerViewProps) {
  const [space, setSpace] = useState<SpaceWithProfile | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/space/${userId}`)
      .then(r => r.json())
      .then(data => { if (data.ok) setSpace(data.data); });
  }, [userId]);

  const updateSpace = useCallback(async (update: Partial<Pick<Space, 'scene' | 'weather'>>) => {
    const res = await fetch('/api/space', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const data = await res.json();
    if (data.ok) setSpace(data.data);
  }, []);

  const saveBio = useCallback(async () => {
    setSaving(true);
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: bioValue }),
    });
    const data = await res.json();
    if (data.ok) {
      setSpace(prev => prev ? { ...prev, bio: bioValue.trim() } : prev);
      setEditingBio(false);
    }
    setSaving(false);
  }, [bioValue]);

  const displayName = space?.display_name || space?.owner_name || '';

  if (!space) {
    return (
      <div className="fixed inset-0 z-30 bg-[var(--bg)] flex items-center justify-center">
        <p className="text-[var(--ink-faint)]">正在进入这个角落...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30">
      <SceneFrame scene={space.scene} weather={space.weather}>
        <AmbientSound weather={space.weather} scene={space.scene} />
        <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-3 pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
          style={{ background: 'linear-gradient(180deg, rgba(250,249,245,0.75) 0%, rgba(250,249,245,0.4) 70%, transparent 100%)' }}>
          <div className="flex items-center justify-between gap-2">
            <button onClick={onExit} className="glass-btn shrink-0 text-xs !px-3 !py-1.5">
              ← 回到公园
            </button>
            <div className="glass px-3 py-1.5 shrink-0 hidden md:block">
              <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                <span style={{ color: 'var(--ink)' }}>{displayName || space.owner_name}</span>
                <span style={{ color: 'var(--ink-weak)' }}> 的角落</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-2">
            <WeatherPicker current={space.weather} onSelect={w => updateSpace({ weather: w })} isOwner={isOwner} />
            <ScenePicker current={space.scene} onSelect={s => updateSpace({ scene: s })} isOwner={isOwner} />
          </div>
        </div>

        <div className="pt-[140px] md:pt-16 h-full overflow-y-auto">
          {/* Bio / Signature section */}
          <div className="px-4 md:px-6 pb-2">
            {isOwner && !editingBio && (
              <div className="flex items-start gap-2">
                <p className="text-[var(--ink-faint)] text-xs italic leading-relaxed flex-1">
                  {space.bio || '写一句签名，让路过的人了解你…'}
                </p>
                <button
                  onClick={() => { setBioValue(space.bio || ''); setEditingBio(true); }}
                  className="text-[var(--ink-weak)] hover:text-[var(--ink-soft)] text-[10px] flex-shrink-0 transition-colors"
                >
                  {space.bio ? '✎' : '+ 签名'}
                </button>
              </div>
            )}
            {isOwner && editingBio && (
              <div className="flex items-center gap-2">
                <input
                  type="text" value={bioValue} onChange={e => setBioValue(e.target.value)}
                  maxLength={120} autoFocus placeholder="写一句签名…"
                  onKeyDown={e => { if (e.key === 'Enter') saveBio(); if (e.key === 'Escape') setEditingBio(false); }}
                  className="flex-1 bg-[var(--surface)] border border-[var(--hairline-strong)] rounded-lg px-3 py-1.5 text-xs text-[var(--ink)] placeholder:text-[var(--ink-weak)] outline-none focus:border-[var(--accent-2)]"
                />
                <button onClick={saveBio} disabled={saving}
                  className="text-[10px] px-2 py-1 rounded-md bg-[var(--bg-soft)] hover:bg-[var(--hairline)] text-[var(--ink-soft)] transition-colors flex-shrink-0">
                  {saving ? '…' : '保存'}
                </button>
              </div>
            )}
            {!isOwner && space.bio && (
              <p className="text-[var(--ink-faint)] text-xs italic leading-relaxed">{space.bio}</p>
            )}
          </div>

          <PhotoWall userId={userId} isOwner={isOwner} scene={space.scene} />
        </div>
      </SceneFrame>
    </div>
  );
}
