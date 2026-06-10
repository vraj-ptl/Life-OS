'use client';

import { useState, useEffect } from 'react';
import { HabitCard } from '@/components/features/HabitCard';
import { WeeklyTracker } from '@/components/features/WeeklyTracker';
import { HabitModal } from '@/components/features/HabitModal';
import { HabitDetailModal } from '@/components/features/HabitDetailModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Flame, Target, Loader2, Sunrise, Sun, Moon, Clock, Trophy } from 'lucide-react';
import api from '@/lib/api';
import styles from './Habits.module.css';

export default function HabitsPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [viewingHabit, setViewingHabit] = useState<any>(null);
  const { toast } = useToast();
  const { updateUser } = useAuth();

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
      if (editingHabit) {
        const res = await api.put<{ habit: any }>(`/habits/${editingHabit._id}`, habitData);
        if (res.success && res.data) {
          setHabits(habits.map(h => h._id === editingHabit._id ? res.data?.habit : h));
          toast({ type: 'success', message: 'Habit updated successfully' });
        }
      } else {
        const res = await api.post<{ habit: any }>('/habits', habitData);
        if (res.success && res.data) {
          setHabits([res.data.habit, ...habits]);
          toast({ type: 'success', message: 'Habit created successfully' });
        }
      }
      setIsModalOpen(false);
      setEditingHabit(null);
    } catch (error: any) {
      toast({ type: 'error', message: 'Failed to save habit', description: error.message });
    }
  };

  const handleToggleHabit = async (id: string, date: string, progress?: number) => {
    try {
      const res = await api.put<{ habit: any, isCompleted: boolean }>(`/habits/${id}/toggle`, { date, progress });
      if (res.success && res.data) {
        setHabits(prev => prev.map(h => h._id === id ? res.data?.habit : h));
        
        // Refresh user XP/Level in AuthContext
        api.get('/auth/me').then(authRes => {
          if (authRes.success && authRes.data) {
            updateUser(authRes.data.user);
          }
        }).catch(err => console.error('Failed to update user XP', err));

        if (res.data.isCompleted) {
          toast({ type: 'success', message: 'Habit completed! Keep the streak going!' });
        }
      }
    } catch (error: any) {
      toast({ type: 'error', message: 'Failed to update habit' });
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    try {
      const res = await api.delete(`/habits/${id}`);
      if (res.success) {
        setHabits(habits.filter(h => h._id !== id));
        toast({ type: 'success', message: 'Habit deleted' });
      }
    } catch (error: any) {
      toast({ type: 'error', message: 'Failed to delete habit' });
    }
  };

  const openEditModal = (habit: any) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const totalStreak = habits.reduce((acc, h) => acc + (h.currentStreak || 0), 0);
  const bestStreak = habits.reduce((acc, h) => Math.max(acc, h.longestStreak || 0), 0);
  const completedToday = habits.filter(h => h.logs?.some((l: any) => l.date.startsWith(todayStr) && l.isCompleted)).length;

  const routines = [
    { id: 'morning', label: 'Morning Routine', icon: Sunrise },
    { id: 'afternoon', label: 'Afternoon Routine', icon: Sun },
    { id: 'evening', label: 'Evening Routine', icon: Moon },
    { id: 'night', label: 'Night Routine', icon: Clock }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Habits</h1>
          <p className={styles.headerSubtitle}>Build consistency and level up</p>
        </div>

        <div className={styles.headerActions}>
          <Button 
            leftIcon={<Plus size={18} />} 
            onClick={() => {
              setEditingHabit(null);
              setIsModalOpen(true);
            }}
          >
            New Habit
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : habits.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <Target size={32} />
          </div>
          <h3 className={styles.emptyTitle}>Build Better Habits</h3>
          <p className={styles.emptySubtitle}>
            Track your daily routines, build streaks, and watch your progress grow over time.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            Start Tracking
          </Button>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statCardGreen}`}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                <Target size={24} />
              </div>
              <div>
                <p className={styles.statLabel}>Total Habits</p>
                <h3 className={`${styles.statValue} ${styles.statValueGreen}`}>{habits.length}</h3>
              </div>
            </div>
            
            <div className={`${styles.statCard} ${styles.statCardBlue}`}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                <span style={{ fontSize: '1.5rem' }}>✨</span>
              </div>
              <div>
                <p className={styles.statLabel}>Done Today</p>
                <h3 className={`${styles.statValue} ${styles.statValueBlue}`}>{completedToday} / {habits.length}</h3>
              </div>
            </div>
            
            <div className={`${styles.statCard} ${styles.statCardAmber}`}>
              <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
                <Flame size={24} />
              </div>
              <div>
                <p className={styles.statLabel}>Active Streak</p>
                <h3 className={`${styles.statValue} ${styles.statValueAmber}`}>{totalStreak}</h3>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCardPurple}`}>
              <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                <Trophy size={24} />
              </div>
              <div>
                <p className={styles.statLabel}>Best Streak</p>
                <h3 className={`${styles.statValue} ${styles.statValuePurple}`}>{bestStreak}</h3>
              </div>
            </div>
          </div>

          {/* Routine Sections */}
          <div className="flex flex-col gap-xl">
            {routines.map(routine => {
              const routineHabits = habits.filter(h => h.timeOfDay === routine.id);
              if (routineHabits.length === 0) return null;
              const Icon = routine.icon;

              return (
                <div key={routine.id} className={styles.taskSection}>
                  <h3 className={styles.sectionTitle}>
                    <Icon size={20} className="text-primary" />
                    {routine.label}
                    <span className="text-sm font-normal text-muted bg-white/5 px-2.5 py-0.5 rounded-full ml-2">
                      {routineHabits.filter(h => h.logs?.some((l: any) => l.date.startsWith(todayStr) && l.isCompleted)).length}/{routineHabits.length}
                    </span>
                  </h3>
                  <div className={styles.tasksGrid}>
                    {routineHabits.map(habit => (
                      <HabitCard 
                        key={habit._id} 
                        habit={habit} 
                        date={todayStr}
                        onToggle={handleToggleHabit} 
                        onEdit={openEditModal}
                        onDelete={handleDeleteHabit}
                        onView={(h) => setViewingHabit(h)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weekly Overview */}
          <div className={styles.taskSection}>
            <h3 className={styles.sectionTitle}>
              📊 Weekly Overview
              <span className="text-sm font-normal text-muted bg-white/5 px-2.5 py-0.5 rounded-full ml-2">
                This Week
              </span>
            </h3>
            <WeeklyTracker habits={habits} />
          </div>
        </>
      )}

      <HabitModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingHabit(null);
        }} 
        onSave={handleSaveHabit}
        habit={editingHabit}
      />

      <HabitDetailModal
        isOpen={Boolean(viewingHabit)}
        onClose={() => setViewingHabit(null)}
        habit={viewingHabit}
        onEdit={(h) => {
          setViewingHabit(null);
          openEditModal(h);
        }}
      />
    </div>
  );
}


