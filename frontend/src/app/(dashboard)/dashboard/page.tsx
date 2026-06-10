'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsapConfig';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Bot, CheckSquare, Target, Wallet, Loader2, Sparkles, TrendingUp, ArrowRight, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const shouldReduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch latest user data to ensure XP/Level is current
        const authRes = await api.get<any>('/auth/me');
        if (authRes.success && authRes.data) {
          updateUser(authRes.data.user);
        }

        const res = await api.get<any>('/analytics/dashboard');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error: any) {
        toast({ type: 'error', message: 'Failed to fetch dashboard data', description: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Staggered entrance animations
  useGSAP(() => {
    if (!isLoading && data && containerRef.current) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Header entrance
      tl.fromTo('.dash-header', 
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      );

      // Stat cards with stagger and spring
      tl.fromTo('.dash-stat-card',
        { y: 60, opacity: 0, scale: 0.9, rotateX: -8 },
        { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 0.7, stagger: 0.12, ease: 'back.out(1.4)' },
        '-=0.3'
      );

      // AI Coach box slides up with scale
      tl.fromTo('.ai-coach-box',
        { y: 40, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.4'
      );

      // Right panel (gamification)
      tl.fromTo('.dash-gamification',
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
        '-=0.5'
      );

      // Achievement badges pop in
      tl.fromTo('.dash-badge',
        { scale: 0.7, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'elastic.out(1, 0.6)' },
        '-=0.3'
      );
    }
  }, { dependencies: [isLoading, data], scope: containerRef });

  // 3D tilt effect for stat cards
  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (shouldReduceMotion()) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPct = x / rect.width;
    const yPct = y / rect.height;

    gsap.to(card, {
      rotateX: (0.5 - yPct) * 8,
      rotateY: (xPct - 0.5) * 8,
      scale: 1.03,
      y: -4,
      duration: 0.35,
      ease: 'power2.out',
      transformPerspective: 800,
      transformOrigin: 'center center',
    });

    // Move shine overlay
    const shine = card.querySelector('.card-shine') as HTMLElement;
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${xPct * 100}% ${yPct * 100}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;
    }
  }, []);

  const handleCardMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (shouldReduceMotion()) return;
    const card = e.currentTarget;
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.6)',
    });
    const shine = card.querySelector('.card-shine') as HTMLElement;
    if (shine) {
      shine.style.background = 'transparent';
    }
  }, []);

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  const statCards = [
    {
      href: '/tasks',
      icon: <CheckSquare size={22} />,
      label: 'Tasks',
      value: data?.overview?.tasks?.pending || 0,
      sublabel: 'Pending Tasks',
      accentColor: 'var(--color-primary)',
      gradientFrom: 'rgba(59, 130, 246, 0.08)',
      gradientTo: 'rgba(59, 130, 246, 0.02)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    {
      href: '/habits',
      icon: <Target size={22} />,
      label: 'Habits',
      value: data?.overview?.habits?.active || 0,
      sublabel: 'Active Tracking',
      accentColor: 'var(--color-success)',
      gradientFrom: 'rgba(34, 197, 94, 0.08)',
      gradientTo: 'rgba(34, 197, 94, 0.02)',
      borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    {
      href: '/finance',
      icon: <Wallet size={22} />,
      label: 'Finance',
      value: formatCurrency(data?.overview?.finance?.balance || 0),
      sublabel: 'Monthly Balance',
      accentColor: 'var(--color-info)',
      gradientFrom: 'rgba(14, 165, 233, 0.08)',
      gradientTo: 'rgba(14, 165, 233, 0.02)',
      borderColor: 'rgba(14, 165, 233, 0.3)',
    },
  ];

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div className="dash-header" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          {getGreeting()}, <span style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0] || 'User'}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>Here's your Life OS summary for today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
        {/* Left 2/3: Stats + AI Coach */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Stats with 3D hover */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {statCards.map((card) => (
              <Link 
                key={card.href} 
                href={card.href} 
                className="dash-stat-card"
                style={{ 
                  display: 'block', 
                  textDecoration: 'none', 
                  color: 'inherit',
                  perspective: '800px',
                }}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
              >
                <div style={{
                  position: 'relative',
                  padding: '22px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${card.gradientFrom}, ${card.gradientTo})`,
                  border: `1px solid ${card.borderColor}`,
                  backdropFilter: 'blur(12px)',
                  overflow: 'hidden',
                  transition: 'border-color 0.3s',
                  willChange: 'transform',
                }}>
                  {/* Shine overlay */}
                  <div className="card-shine" style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '16px',
                    pointerEvents: 'none',
                    transition: 'background 0.3s',
                    zIndex: 1,
                  }} />

                  {/* Decorative glow */}
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    background: card.accentColor,
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                    opacity: 0.15,
                    pointerEvents: 'none',
                  }} />

                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: card.accentColor }}>
                        {card.icon}
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{card.label}</span>
                      </div>
                      <ArrowRight size={16} style={{ color: 'var(--text-muted)', opacity: 0.5, transition: 'all 0.3s' }} />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.02em' }}>
                      {card.value}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{card.sublabel}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* AI Coach Insight — glassmorphism card */}
          <div className="ai-coach-box" style={{
            position: 'relative',
            padding: '28px',
            borderRadius: '20px',
            background: 'rgba(14, 165, 233, 0.04)',
            border: '1px solid rgba(14, 165, 233, 0.15)',
            backdropFilter: 'blur(16px)',
            overflow: 'hidden',
          }}>
            {/* Decorative gradient blobs */}
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '200px', height: '200px',
              background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12), transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: '-30px', left: '-30px',
              width: '160px', height: '160px',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08), transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', flexShrink: 0,
                boxShadow: '0 8px 24px rgba(14, 165, 233, 0.25)',
              }}>
                <Bot size={26} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-light)', margin: 0 }}>AI Life Coach</h3>
                  <span style={{
                    background: 'rgba(14, 165, 233, 0.15)',
                    color: 'var(--color-primary)',
                    fontSize: '0.7rem',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <Sparkles size={10} /> Phi-4 Mini
                  </span>
                </div>
                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}>
                  {data?.aiInsight || "I'm analyzing your data to provide insights..."}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column — Gamification Widget */}
        <div className="dash-gamification" style={{ gridColumn: 'span 1' }}>
          <div style={{
            padding: '28px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-default)',
            backdropFilter: 'blur(12px)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 24px 0' }}>
              <TrendingUp size={20} style={{ color: 'var(--color-accent)' }} /> Your Progress
            </h3>

            {/* XP Ring */}
            {(() => {
              const totalXp = user?.xp || 0;
              const currentLevel = user?.level || 1;
              const xpInCurrentLevel = totalXp % 100;
              const xpNeeded = 100;
              const progressPct = xpInCurrentLevel / xpNeeded;
              const circumference = 2 * Math.PI * 42; // ~263.9
              const dashOffset = circumference - (circumference * progressPct);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
                  <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                      {/* Background track */}
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke="var(--bg-input)"
                        strokeWidth="7"
                      />
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--color-accent)" />
                          <stop offset="100%" stopColor="var(--color-primary)" />
                        </linearGradient>
                      </defs>
                      {/* Progress fill */}
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke="url(#xpGradient)"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={circumference.toFixed(2)}
                        strokeDashoffset={dashOffset.toFixed(2)}
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{
                        fontSize: '2.2rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1,
                      }}>{currentLevel}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Level</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {xpInCurrentLevel} / {xpNeeded} XP
                    </p>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary-light)', marginBottom: '4px' }}>
                      {xpNeeded - xpInCurrentLevel} XP to Level {currentLevel + 1}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total: {totalXp} XP earned</p>
                  </div>
                </div>
              );
            })()}

            {/* Quick Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              <div style={{
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                  {data?.overview?.tasks?.completed7d || 0}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Done (7d)
                </div>
              </div>
              <div style={{
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.06)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>
                  {data?.overview?.habits?.averageStreak ? Math.round(data.overview.habits.averageStreak) : 0}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Avg Streak
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Recent Achievements</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="dash-badge" style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px', borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', flexShrink: 0,
                  }}>🔥</div>
                  <div>
                    <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>On Fire</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>7 day habit streak</p>
                  </div>
                </div>
                <div className="dash-badge" style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px', borderRadius: '12px',
                  background: 'rgba(34, 197, 94, 0.05)',
                  border: '1px solid rgba(34, 197, 94, 0.15)',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', flexShrink: 0,
                  }}>🎯</div>
                  <div>
                    <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>Task Master</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Completed 50 tasks</p>
                  </div>
                </div>
                <div className="dash-badge" style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px', borderRadius: '12px',
                  background: 'rgba(14, 165, 233, 0.05)',
                  border: '1px solid rgba(14, 165, 233, 0.15)',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(14, 165, 233, 0.05))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', flexShrink: 0,
                  }}>💰</div>
                  <div>
                    <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>Budget Pro</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Stayed under budget</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
