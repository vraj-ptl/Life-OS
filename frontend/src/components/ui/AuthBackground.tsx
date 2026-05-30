'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsapConfig';

export const AuthBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Floating animations for orbs
    gsap.to(orb1Ref.current, {
      x: 'random(-50, 50)',
      y: 'random(-50, 50)',
      duration: 8,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    gsap.to(orb2Ref.current, {
      x: 'random(-80, 80)',
      y: 'random(-40, 40)',
      duration: 10,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: -2,
    });

    gsap.to(orb3Ref.current, {
      x: 'random(-40, 40)',
      y: 'random(-80, 80)',
      duration: 12,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: -4,
    });

    // Subtle parallax on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 30;
      const yPos = (clientY / window.innerHeight - 0.5) * 30;

      gsap.to(orb1Ref.current, { x: xPos, y: yPos, duration: 2, ease: 'power2.out' });
      gsap.to(orb2Ref.current, { x: xPos * -0.5, y: yPos * -0.5, duration: 2.5, ease: 'power2.out' });
      gsap.to(orb3Ref.current, { x: xPos * 0.8, y: yPos * 0.8, duration: 3, ease: 'power2.out' });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, { scope: containerRef });

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
    background: 'var(--bg-primary)',
  };

  const orbBase: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* Orb 1: Cyan */}
      <div
        ref={orb1Ref}
        style={{
          ...orbBase,
          top: '20%',
          left: '15%',
          width: '50vh',
          height: '50vh',
          background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)',
          filter: 'blur(120px)',
          opacity: 0.35,
        }}
      />

      {/* Orb 2: Emerald */}
      <div
        ref={orb2Ref}
        style={{
          ...orbBase,
          bottom: '15%',
          right: '15%',
          width: '60vh',
          height: '60vh',
          background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
          filter: 'blur(140px)',
          opacity: 0.25,
        }}
      />

      {/* Orb 3: Deep Blue */}
      <div
        ref={orb3Ref}
        style={{
          ...orbBase,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70vh',
          height: '70vh',
          background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
          filter: 'blur(150px)',
          opacity: 0.15,
        }}
      />
    </div>
  );
};
