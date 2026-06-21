'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsapConfig';

export const AuthBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorOrbRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);
  const orb4Ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Advanced Floating animations for background orbs
    const orbs = [
      { ref: orb1Ref, x: 100, y: 100, dur: 12 },
      { ref: orb2Ref, x: -120, y: 80, dur: 15 },
      { ref: orb3Ref, x: 80, y: -100, dur: 10 },
      { ref: orb4Ref, x: -100, y: -120, dur: 14 }
    ];

    orbs.forEach((orb, i) => {
      gsap.to(orb.ref.current, {
        x: `random(-${orb.x}, ${orb.x})`,
        y: `random(-${orb.y}, ${orb.y})`,
        scale: 'random(0.8, 1.2)',
        duration: orb.dur,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: -i * 2,
      });
    });

    // Smooth Cursor follow for the main interactive orb
    let ctx = gsap.context(() => {
      window.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        
        // The interactive orb follows the cursor smoothly
        gsap.to(cursorOrbRef.current, {
          x: clientX - window.innerWidth / 2,
          y: clientY - window.innerHeight / 2,
          duration: 1.5,
          ease: 'power3.out',
        });

        // Other orbs subtly react to mouse position (parallax)
        const xPos = (clientX / window.innerWidth - 0.5) * 50;
        const yPos = (clientY / window.innerHeight - 0.5) * 50;

        gsap.to(orb1Ref.current, { x: '+=' + xPos * 0.1, y: '+=' + yPos * 0.1, duration: 2 });
        gsap.to(orb2Ref.current, { x: '+=' + xPos * -0.15, y: '+=' + yPos * -0.15, duration: 2 });
      });
    });

    return () => ctx.revert();
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
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* Interactive Cursor Glow - Primary Cyan */}
      <div
        ref={cursorOrbRef}
        style={{
          ...orbBase,
          top: '50%',
          left: '50%',
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 60%)',
          filter: 'blur(100px)',
          opacity: 0.15,
          zIndex: 2,
        }}
      />

      {/* Background Orb 1 - Primary Light */}
      <div
        ref={orb1Ref}
        style={{
          ...orbBase,
          top: '20%',
          left: '20%',
          width: '55vw',
          height: '55vw',
          background: 'radial-gradient(circle, var(--color-primary-light) 0%, transparent 60%)',
          filter: 'blur(120px)',
          opacity: 0.15,
        }}
      />

      {/* Background Orb 2 - Teal (from gradient) */}
      <div
        ref={orb2Ref}
        style={{
          ...orbBase,
          bottom: '10%',
          right: '10%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, #14b8a6 0%, transparent 60%)',
          filter: 'blur(140px)',
          opacity: 0.12,
        }}
      />

      {/* Background Orb 3 - Primary Dark */}
      <div
        ref={orb3Ref}
        style={{
          ...orbBase,
          top: '60%',
          left: '70%',
          width: '45vw',
          height: '45vw',
          background: 'radial-gradient(circle, var(--color-primary-dark) 0%, transparent 60%)',
          filter: 'blur(130px)',
          opacity: 0.15,
        }}
      />

      {/* Background Orb 4 - Accent Glow */}
      <div
        ref={orb4Ref}
        style={{
          ...orbBase,
          bottom: '30%',
          left: '10%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 60%)',
          filter: 'blur(150px)',
          opacity: 0.1,
        }}
      />
      
      {/* Grid overlay for texture */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.5,
          zIndex: 1,
        }}
      />
    </div>
  );
};
