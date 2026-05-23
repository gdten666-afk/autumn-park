'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins (only in browser)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function GSAPAnimations() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Fade in welcome text
    gsap.from('.welcome-text', {
      opacity: 0,
      y: 30,
      duration: 1.2,
      delay: 0.3,
      ease: 'power3.out',
    });

    // Fade in scroll hint
    gsap.from('.scroll-hint', {
      opacity: 0,
      duration: 1,
      delay: 1.5,
      ease: 'power2.out',
    });

    // Animate photo cards on entry with stagger
    const photosObserver = new MutationObserver(() => {
      const cards = document.querySelectorAll('.polaroid-card');
      if (cards.length > 0) {
        gsap.from(cards, {
          opacity: 0,
          y: 40,
          scale: 0.9,
          rotation: 0,
          duration: 0.7,
          stagger: 0.06,
          ease: 'back.out(1.4)',
        });
      }
    });

    photosObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Add parallax to trees on scroll
    const container = document.querySelector('.park-scroll-container');
    if (container) {
      gsap.to('.park-tree-layer', {
        x: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'left left',
          end: 'right right',
          scrub: 0.3,
        },
      });
    }

    return () => {
      photosObserver.disconnect();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return null;
}
