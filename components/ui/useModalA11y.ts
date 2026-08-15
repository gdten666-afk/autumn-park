// components/ui/useModalA11y.ts — 对话框语义 + Escape + 焦点陷阱 + 焦点归还
'use client';

import { useEffect, useRef } from 'react';

export function useModalA11y(open: boolean, onClose: () => void, label: string) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const prev = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(
      el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(n => n.offsetParent !== null || n === document.activeElement);
    const first = focusables()[0];
    (first || el).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key === 'Tab') {
        const list = focusables();
        if (list.length === 0) return;
        const f = list[0], l = list[list.length - 1];
        if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
        else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      prev?.focus?.();
    };
  }, [open, onClose]);

  return {
    ref,
    props: { role: 'dialog', 'aria-modal': true, 'aria-label': label } as const,
  };
}
