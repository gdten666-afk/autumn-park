// components/park/HeroTitle.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';

const DEFAULT_TITLE = '在公园里，慢慢走。';

export interface HotMessage { id: string; content: string; likes: number; }

export default function HeroTitle() {
  const [message, setMessage] = useState<HotMessage | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/messages/hot');
      const d = await r.json();
      if (d.ok) setMessage(d.data as HotMessage | null);
    } catch { /* 保持当前标题 */ }
  }, []);

  useEffect(() => {
    const t0 = setTimeout(refresh, 0);
    const t = setInterval(refresh, 60_000);
    const onChanged = () => refresh();
    window.addEventListener('messages-changed', onChanged);
    return () => { clearTimeout(t0); clearInterval(t); window.removeEventListener('messages-changed', onChanged); };
  }, [refresh]);

  return (
    <h1 className="m-0 text-[clamp(30px,5vw,52px)] leading-[1.34] font-medium tracking-wide">
      {message ? `「${message.content}」` : DEFAULT_TITLE}
      {message && (
        <span className="hero-title-note">—— 来自留言墙 · {message.likes} 人喜欢</span>
      )}
    </h1>
  );
}
