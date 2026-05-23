'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function GSAPAnimations() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Entrance animations — one-shot, no observers
    const timer = setTimeout(() => {
      gsap.from('.welcome-text', { opacity: 0, y: 30, duration: 1, ease: 'power3.out' });
      gsap.from('.scroll-hint', { opacity: 0, duration: 0.8, delay: 0.8 });

      // Animate existing polaroid cards
      const cards = document.querySelectorAll('.polaroid-card');
      if (cards.length > 0) {
        gsap.from(cards, { opacity: 0, y: 30, scale: 0.9, duration: 0.6, stagger: 0.05, ease: 'back.out(1.2)' });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
