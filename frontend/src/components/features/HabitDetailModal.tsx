'use client';
import { useState, useEffect } from 'react';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  Clock, Flame, Trophy, Calendar, Target, Repeat,
  CheckCircle2, Edit2, Hash
} from 'lucide-react';

interface HabitLog {
  date: string;
  progress: number;
  isCompleted: boolean;
  completedAt?: string;
}

interface Habit {
  _id: string;
  name: string;
  icon: string;
  color: string;
  trackingType: string;
  targetValue: number;
  unit: string;
  frequency: string;
  timeOfDay: string;
  currentStreak: number;
  longestStreak: number;
  category: string;
  logs: HabitLog[];
  createdAt?: string;
}

interface HabitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit | null;
  onEdit: (habit: Habit) => void;
}

const getTimeRange = (timeOfDay: string): string => {
  switch (timeOfDay) {
    case 'morning': return '00:00 – 11:59';
    case 'afternoon': return '12:00 – 16:59';
    case 'evening': return '17:00 – 20:59';
    case 'night': return '21:00 – 23:59';
    default: return '';
  }
};

const getTimeLabel = (timeOfDay: string): string => {
  switch (timeOfDay) {
    case 'morning': return '🌅 Morning';
    case 'afternoon': return '☀️ Afternoon';
    case 'evening': return '🌇 Evening';
    case 'night': return '🌙 Night';
    default: return timeOfDay;
  }
};

const frequencyLabel = (f: string): string => {
  switch (f) {
    case 'daily': return '📅 Daily';
    case 'weekly': return '📆 Weekly';
    default: return f;
  }
};

export const HabitDetailModal = ({ isOpen, onClose, habit, onEdit }: HabitDetailModalProps) => {
  const [timeState, setTimeState] = useState({ status: 'active', progress: 0, timeText: '' });

  useEffect(() => {
    if (!habit || !isOpen) return;

    const updateTime = () => {
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA');
      const todayLog = habit.logs?.find(l => l.date.startsWith(todayStr));
      const isCompletedToday = todayLog?.isCompleted || false;

      const timeInMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

      let startMin = 0, endMin = 0;
      if (habit.timeOfDay === 'morning') { startMin = 0; endMin = 12 * 60 - 1; }
      else if (habit.timeOfDay === 'afternoon') { startMin = 12 * 60; endMin = 17 * 60 - 1; }
      else if (habit.timeOfDay === 'evening') { startMin = 17 * 60; endMin = 21 * 60 - 1; }
      else if (habit.timeOfDay === 'night') { startMin = 21 * 60; endMin = 24 * 60 - 1; }

      if (isCompletedToday) {
        const completedTime = todayLog?.completedAt
          ? new Date(todayLog.completedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : '';
        setTimeState({ status: 'completed', progress: 100, timeText: completedTime ? `Completed at ${completedTime}` : 'Completed' });
      } else if (timeInMinutes < startMin) {
        const m = Math.floor(startMin - timeInMinutes);
        setTimeState({ status: 'upcoming', progress: 0, timeText: `Starts in ${Math.floor(m / 60)}h ${m % 60}m` });
      } else if (timeInMinutes > endMin) {
        setTimeState({ status: 'expired', progress: 100, timeText: 'Time Expired' });
      } else {
        const prog = ((timeInMinutes - startMin) / (endMin - startMin)) * 100;
        const left = Math.floor(endMin - timeInMinutes);
        setTimeState({ status: 'active', progress: prog, timeText: `${Math.floor(left / 60)}h ${left % 60}m left` });
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [habit, isOpen]);

  if (!habit) return null;

  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayLog = habit.logs?.find(l => l.date.startsWith(todayStr));
  const isCompletedToday = todayLog?.isCompleted || false;

  // Recent completions (last 7)
  const recentLogs = [...(habit.logs || [])]
    .filter(l => l.isCompleted)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const totalCompletions = habit.logs?.filter(l => l.isCompleted).length || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
      footer={
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button leftIcon={<Edit2 size={16} />} onClick={() => { onClose(); onEdit(habit); }}>
            Edit Habit
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Icon + Title + Status */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{
              width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', background: `${habit.color}20`, border: `1px solid ${habit.color}40`, flexShrink: 0,
            }}>
              {habit.icon}
            </span>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: isCompletedToday ? 'var(--color-success-light)' : 'var(--text-primary)', margin: 0 }}>
                {habit.name}
              </h2>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px',
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                background: isCompletedToday ? 'rgba(34,197,94,0.15)' : timeState.status === 'expired' ? 'rgba(239,68,68,0.15)' : 'rgba(14,165,233,0.15)',
                color: isCompletedToday ? 'var(--color-success)' : timeState.status === 'expired' ? 'var(--color-danger)' : 'var(--color-info)',
                border: `1px solid ${isCompletedToday ? 'rgba(34,197,94,0.3)' : timeState.status === 'expired' ? 'rgba(239,68,68,0.3)' : 'rgba(14,165,233,0.3)'}`,
              }}>
                {isCompletedToday ? '✅ Done Today' : timeState.status === 'expired' ? '❌ Missed' : timeState.status === 'upcoming' ? '⏳ Upcoming' : '⚡ Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: `${habit.color}10`, border: `1px solid ${habit.color}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: habit.color, fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
              <Hash size={13} /> CATEGORY
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>
              {habit.category}
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
              <Repeat size={13} /> FREQUENCY
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
              {frequencyLabel(habit.frequency)}
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-info)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
              <Clock size={13} /> TIME WINDOW
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
              {getTimeLabel(habit.timeOfDay)} ({getTimeRange(habit.timeOfDay)})
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
              <Flame size={13} /> STREAK
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
              {habit.currentStreak} current · {habit.longestStreak} best
            </div>
          </div>
        </div>

        {/* Time Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Time Progress
              {timeState.timeText && <span style={{
                color: timeState.status === 'completed' ? 'var(--color-success)' : timeState.status === 'expired' ? 'var(--color-danger)' : 'var(--color-info)'
              }}>{timeState.timeText}</span>}
            </span>
            <span style={{
              color: timeState.status === 'completed' ? 'var(--color-success)' : timeState.status === 'expired' ? 'var(--color-danger)' : 'var(--color-primary)'
            }}>
              {timeState.progress.toFixed(2)}%
            </span>
          </div>
          <div style={{ height: '8px', width: '100%', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
            <div style={{
              height: '100%', width: `${timeState.progress}%`,
              background: timeState.status === 'completed'
                ? 'var(--color-success)'
                : timeState.status === 'expired'
                  ? 'var(--color-danger)'
                  : `linear-gradient(90deg, ${habit.color}80, ${habit.color})`,
              borderRadius: '999px', transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-success)' }}>{totalCompletions}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '2px' }}>Total Done</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#f59e0b' }}>{habit.currentStreak}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '2px' }}>Current Streak</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#a855f7' }}>{habit.longestStreak}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '2px' }}>Best Streak</div>
          </div>
        </div>

        {/* Recent Activity */}
        {recentLogs.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
              <Calendar size={15} /> Recent Completions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentLogs.map((log, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '8px',
                  background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="var(--color-success)" />
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {log.completedAt && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(log.completedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Created timestamp */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-default)', paddingTop: '12px' }}>
          {habit.createdAt && (
            <span>Created: {new Date(habit.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
          )}
        </div>
      </div>
    </Modal>
  );
};
