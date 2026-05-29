'use client';

import { useState, useEffect } from 'react';
import { HabitCard } from '@/components/features/HabitCard';
import { HabitHeatmap } from '@/components/features/HabitHeatmap';
import { HabitModal } from '@/components/features/HabitModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Plus, Flame, Target, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function HabitsPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchHabits = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ habits: any[] }>('/habits');
      if (res.success && res.data) {
        setHabits(res.data.habits);
      }
    } catch (error: any) {
      toast({ type: 'error', message: 'Failed to fetch habits', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleSaveHabit = async (habitData: any) => {
    try {
      const res = await api.post<{ habit: any }>('/habits', habitData);
      if (res.success && res.data) {
        setHabits([res.data.habit, ...habits]);
        toast({ type: 'success', message: 'Habit created successfully' });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast({ type: 'error', message: 'Failed to create habit', description: error.message });
    }
  };

  const handleToggleHabit = async (id: string, date: string) => {
    // Optimistic update
    setHabits(habits.map(h => {
      if (h._id === id) {
        const isCompleted = h.completedDates.some((d: string) => d.startsWith(date));
        let newCompletedDates = [...h.completedDates];
        if (isCompleted) {
          newCompletedDates = newCompletedDates.filter((d: string) => !d.startsWith(date));
        } else {
          newCompletedDates.push(`${date}T00:00:00.000Z`);
        }
        return { ...h, completedDates: newCompletedDates };
      }
      return h;
    }));

    try {
      const res = await api.put<{ habit: any, isCompleted: boolean }>(`/habits/${id}/toggle`, { date });
      if (res.success && res.data) {
        // Refresh this specific habit from server response to get accurate streak
        setHabits(prev => prev.map(h => h._id === id ? res.data?.habit : h));
        if (res.data.isCompleted) {
          toast({ type: 'success', message: 'Habit completed! Keep the streak going!' });
        }
      }
    } catch (error: any) {
      fetchHabits(); // Revert on error
      toast({ type: 'error', message: 'Failed to update habit' });
    }
  };

  const totalStreak = habits.reduce((acc, h) => acc + h.currentStreak, 0);
  const completedToday = habits.filter(h => h.completedDates.some((d: string) => d.startsWith(todayStr))).length;

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-1">Habits</h1>
          <p className="text-secondary text-sm">Build consistency and level up</p>
        </div>

        <Button 
          leftIcon={<Plus size={18} />} 
          onClick={() => setIsModalOpen(true)}
        >
          New Habit
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border-dashed rounded-xl border-dashed">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <Target size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">Build Better Habits</h3>
          <p className="text-secondary max-w-sm mb-6">
            Track your daily routines, build streaks, and watch your progress grow over time.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            Start Tracking
          </Button>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border-default rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center">
                <Target size={24} />
              </div>
              <div>
                <p className="text-sm text-secondary">Total Habits</p>
                <h3 className="text-2xl font-bold">{habits.length}</h3>
              </div>
            </div>
            
            <div className="bg-card border border-border-default rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-warning/20 text-warning flex items-center justify-center">
                <Flame size={24} />
              </div>
              <div>
                <p className="text-sm text-secondary">Total Streak</p>
                <h3 className="text-2xl font-bold">{totalStreak}</h3>
              </div>
            </div>
            
            <div className="bg-card border border-border-default rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <p className="text-sm text-secondary">Done Today</p>
                <h3 className="text-2xl font-bold">{completedToday} / {habits.length}</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            {/* Today's Habits */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Today's Habits 
                <span className="text-sm font-normal text-muted bg-white/5 px-2 py-0.5 rounded-full">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </h3>
              
              <div className="flex flex-col gap-3">
                {habits.map(habit => (
                  <HabitCard 
                    key={habit._id} 
                    habit={habit} 
                    date={todayStr}
                    isCompletedToday={habit.completedDates.some((d: string) => d.startsWith(todayStr))}
                    onToggle={handleToggleHabit} 
                  />
                ))}
              </div>
            </div>

            {/* Heatmaps */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Activity Overview</h3>
              
              <div className="flex flex-col gap-4">
                {habits.slice(0, 3).map(habit => (
                  <div key={habit._id} className="relative group">
                    <HabitHeatmap 
                      completedDates={habit.completedDates} 
                      color={habit.color}
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="text-sm">{habit.icon}</span>
                      <span className="text-sm font-medium text-white/80">{habit.name}</span>
                    </div>
                  </div>
                ))}
                {habits.length > 3 && (
                  <div className="text-center text-sm text-muted mt-2">
                    And {habits.length - 3} more habits being tracked...
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <HabitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveHabit} 
      />
    </div>
  );
}
