'use client';

import Link from 'next/link';
import MessageWall from '@/components/park/MessageWall';

export default function WallPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', color: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--hairline)' }}>
        <Link href="/park" className="btn-ghost !py-1.5 text-xs">← 回到公园</Link>
        <span className="text-sm font-serif tracking-wider">留言墙</span>
        <span style={{ width: 76 }} />
      </header>
      <MessageWall mode="page" />
    </div>
  );
}
