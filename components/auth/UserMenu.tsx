'use client';

import type { UserSession } from '@/lib/types';

interface UserMenuProps {
  session: UserSession;
  onEnterCorner: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export default function UserMenu({ session, onEnterCorner, onOpenAdmin, onLogout }: UserMenuProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="chip">
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-2)' }} />
        <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{session.name}</span>
      </div>

      <button type="button" onClick={onEnterCorner} className="glass-btn !px-3 !py-1.5 text-[11px]">我的角落</button>

      {session.role === 'operator' && (
        <button type="button" onClick={onOpenAdmin} className="btn-ghost !py-1.5">管理</button>
      )}

      <button type="button" onClick={onLogout} className="btn-ghost !py-1.5 text-[11px]">离开</button>
    </div>
  );
}
