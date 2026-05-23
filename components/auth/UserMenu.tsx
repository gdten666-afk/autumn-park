// components/auth/UserMenu.tsx
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
    <div className="fixed top-4 z-30 flex items-center gap-2" style={{ right: '296px' }}>
      <div className="glass flex items-center gap-2 px-4 py-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
        <span className="text-white/60 text-sm">{session.name}</span>
      </div>

      <button onClick={onEnterCorner} className="glass-btn">
        我的角落
      </button>

      {session.role === 'operator' && (
        <button onClick={onOpenAdmin} className="glass-btn !bg-amber-500/10 !border-amber-500/20 !text-amber-300/80 hover:!bg-amber-500/20">
          管理
        </button>
      )}

      <button onClick={onLogout} className="btn-ghost text-[11px]">
        离开
      </button>
    </div>
  );
}
