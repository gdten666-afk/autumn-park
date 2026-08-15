'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function GSAPAnimations() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const timer = setTimeout(() => {
      gsap.from('.welcome-text', { opacity: 0, y: 30, duration: 1, ease: 'power3.out' });
      gsap.from('.scroll-hint', { opacity: 0, duration: 0.8, delay: 0.8 });

      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        // 固定定位的面板/控件不参与滚动显现动画——gsap.from 会触发其内部绝对定位子元素的
        // 包含块重算，造成布局位移（实测 CLS 0.236）
        if (getComputedStyle(el).position === 'fixed') return;
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('.parallax-slow').forEach((el) => {
        gsap.to(el, {
          yPercent: 18,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        });
      });
    }, 400);

    return () => { clearTimeout(timer); ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return null;
}
