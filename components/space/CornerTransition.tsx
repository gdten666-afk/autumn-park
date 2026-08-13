// components/space/CornerTransition.tsx
'use client';

import { motion } from 'framer-motion';

interface CornerTransitionProps {
  onEntered: () => void;
  isEntering: boolean;
  ownerName: string;
}

export default function CornerTransition({ onEntered, isEntering, ownerName }: CornerTransitionProps) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--bg)]/90 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: isEntering ? 1 : 0 }}
      transition={{ duration: 1.5 }}
      onAnimationComplete={() => {
        if (isEntering) onEntered();
      }}
    >
      <div className="text-center">
        <motion.div
          className="w-24 h-0.5 bg-[var(--hairline-strong)] mx-auto mb-4"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isEntering ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        />
        <motion.p
          className="text-[var(--ink-soft)] text-sm tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: isEntering ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          走进 {ownerName} 的角落
        </motion.p>
      </div>
    </motion.div>
  );
}
