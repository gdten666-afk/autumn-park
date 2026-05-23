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
    <div className="fixed top-4 right-4 z-30 flex items-center gap-3">
      <span className="text-white/50 text-sm">{session.name}</span>

      <button
        onClick={onEnterCorner}
        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm text-white/80 transition-colors"
      >
        我的角落
      </button>

      {session.role === 'operator' && (
        <button
          onClick={onOpenAdmin}
          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded text-sm text-amber-300/80 transition-colors"
        >
          管理
        </button>
      )}

      <button
        onClick={onLogout}
        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-sm text-white/40 transition-colors"
      >
        离开
      </button>
    </div>
  );
}
