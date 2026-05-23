// components/space/CornerTransition.tsx
'use client';

import { motion } from 'framer-motion';

interface CornerTransitionProps {
  onEntered: () => void;
  onExited: () => void;
  isEntering: boolean;
  ownerName: string;
}

export default function CornerTransition({ onEntered, onExited, isEntering, ownerName }: CornerTransitionProps) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: isEntering ? 1 : 0 }}
      transition={{ duration: 1.5 }}
      onAnimationComplete={() => {
        if (isEntering) onEntered();
      }}
    >
      <div className="text-center">
        <motion.div
          className="w-24 h-0.5 bg-white/30 mx-auto mb-4"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isEntering ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        />
        <motion.p
          className="text-white/50 text-sm tracking-widest"
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
