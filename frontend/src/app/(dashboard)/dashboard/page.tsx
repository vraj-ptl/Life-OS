'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsapConfig';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Bot, CheckSquare, Target, Wallet, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
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

  useGSAP(() => {
    if (!isLoading && data) {
      gsap.from('.dash-card', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
      });
      
      gsap.from('.ai-coach-box', {
        scale: 0.95,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(1.2)',
        delay: 0.3
      });
    }
  }, { dependencies: [isLoading, data], scope: containerRef });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-xl">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          Good morning, <span className="text-gradient">{user?.name?.split(' ')[0] || 'User'}</span>
        </h1>
        <p className="text-secondary text-sm">Here's your Life OS summary for today.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left Column (Stats & Quick Links) */}
        <div className="lg:col-span-2 flex flex-col gap-lg">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/tasks" className="dash-card block group">
              <Card hover className="p-4 flex flex-col h-full border-l-4 border-l-primary bg-gradient-to-br from-card to-card-hover">
                <div className="flex items-center gap-2 text-primary mb-3">
                  <CheckSquare size={20} />
                  <span className="font-medium">Tasks</span>
                </div>
                <div className="mt-auto">
                  <div className="text-3xl font-bold mb-1">{data?.overview?.tasks?.pending || 0}</div>
                  <div className="text-xs text-muted">Pending Tasks</div>
                </div>
              </Card>
            </Link>

            <Link href="/habits" className="dash-card block group">
              <Card hover className="p-4 flex flex-col h-full border-l-4 border-l-success bg-gradient-to-br from-card to-card-hover">
                <div className="flex items-center gap-2 text-success mb-3">
                  <Target size={20} />
                  <span className="font-medium">Habits</span>
                </div>
                <div className="mt-auto">
                  <div className="text-3xl font-bold mb-1">{data?.overview?.habits?.active || 0}</div>
                  <div className="text-xs text-muted">Active Tracking</div>
                </div>
              </Card>
            </Link>

            <Link href="/finance" className="dash-card block group">
              <Card hover className="p-4 flex flex-col h-full border-l-4 border-l-info bg-gradient-to-br from-card to-card-hover">
                <div className="flex items-center gap-2 text-info mb-3">
                  <Wallet size={20} />
                  <span className="font-medium">Finance</span>
                </div>
                <div className="mt-auto">
                  <div className="text-2xl font-bold mb-1 truncate">
                    {formatCurrency(data?.overview?.finance?.balance || 0)}
                  </div>
                  <div className="text-xs text-muted">Monthly Balance</div>
                </div>
              </Card>
            </Link>
          </div>

          {/* AI Coach Insight */}
          <Card glass className="ai-coach-box p-xl relative overflow-hidden border-primary/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex items-start gap-md relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <Bot size={24} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg text-primary-light">AI Life Coach</h3>
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={10} /> Phi-4 Mini
                  </span>
                </div>
                
                <div className="text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                  {data?.aiInsight || "I'm analyzing your data to provide insights..."}
                </div>
              </div>
            </div>
          </Card>

        </div>

        {/* Right Column (Gamification Widget) */}
        <div className="lg:col-span-1 flex flex-col gap-lg">
          <Card className="dash-card p-lg h-full border-border-default bg-card/50">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-accent" /> Your Progress
            </h3>

            <div className="flex flex-col items-center mb-8">
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background track */}
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="var(--bg-input)" 
                    strokeWidth="8"
                  />
                  {/* Progress fill */}
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="var(--color-accent)" 
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * (user?.xp ? (user.xp % 100) / 100 : 0))}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gradient-accent">{user?.level || 1}</span>
                  <span className="text-[10px] text-muted uppercase tracking-wider">Level</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-primary mb-1">
                  {user?.xp ? (100 - (user.xp % 100)) : 100} XP to Level {user?.level ? user.level + 1 : 2}
                </p>
                <p className="text-xs text-secondary">Complete tasks and habits to level up!</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted uppercase tracking-wider">Recent Achievements</h4>
              {/* Dummy Badges */}
              <div className="flex items-center gap-3 p-3 bg-input rounded-lg border border-border-subtle">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-xl">🔥</div>
                <div>
                  <p className="text-sm font-medium">On Fire</p>
                  <p className="text-xs text-muted">7 day habit streak</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-input rounded-lg border border-border-subtle">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-xl">🎯</div>
                <div>
                  <p className="text-sm font-medium">Task Master</p>
                  <p className="text-xs text-muted">Completed 50 tasks</p>
                </div>
              </div>
            </div>

          </Card>
        </div>
      </div>
    </div>
  );
}
