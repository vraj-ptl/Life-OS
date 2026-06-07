'use client';
import { useState, useEffect } from 'react';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getPriorityColor, getStatusColor, formatRelativeDate } from '@/lib/utils';
import { 
  Calendar, Clock, Zap, Flag, Tag, ListTodo, Repeat, 
  CheckCircle2, AlertCircle, Edit2, FileText 
} from 'lucide-react';

interface Subtask {
  title: string;
  isCompleted: boolean;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'done' | 'overdue';
  deadline?: string;
  startTime?: string;
  energyRequired: 'low' | 'medium' | 'high';
  tags?: string[];
  subtasks?: Subtask[];
  recurring?: {
    isRecurring: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  };
  suggestedTime?: {
    startTime: string;
    endTime: string;
    reason: string;
  };
  createdAt?: string;
  completedAt?: string;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit: (task: Task) => void;
  onStatusChange?: (id: string, status: Task['status']) => void;
  onSubtaskToggle?: (id: string, index: number) => void;
}

const priorityLabels: Record<string, string> = {
  low: '🟢 Low',
  medium: '🔵 Medium',
  high: '🟡 High',
  urgent: '🔴 Urgent',
};

const statusLabels: Record<string, string> = {
  todo: '📋 To Do',
  'in-progress': '⚡ In Progress',
  done: '✅ Completed',
  overdue: '🚨 Overdue',
};

const energyLabels: Record<string, string> = {
  low: '🟢 Low Energy',
  medium: '🔵 Medium Energy',
  high: '🟡 High Energy',
};

export const TaskDetailModal = ({ isOpen, onClose, task, onEdit, onStatusChange, onSubtaskToggle }: TaskDetailModalProps) => {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!task) return;

    if (task.status === 'done') {
      setProgress(100);
      if (task.completedAt) {
        const completedDate = new Date(task.completedAt);
        const formattedTime = completedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        setTimeLeft(`Completed at ${formattedTime}`);
      } else {
        setTimeLeft('Completed');
      }
      return;
    }

    if (!task.startTime || !task.deadline) {
      setProgress(0);
      setTimeLeft('');
      return;
    }
    const calculateProgress = () => {
      const start = new Date(task.startTime!).getTime();
      const end = new Date(task.deadline!).getTime();
      const now = Date.now();
      
      if (now <= start) {
        setProgress(0);
        setTimeLeft('Not started yet');
      } else if (now >= end) {
        setProgress(100);
        setTimeLeft('Time is up');
      } else {
        setProgress(((now - start) / (end - start)) * 100);
        
        const diff = end - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);
        
        setTimeLeft(`${parts.join(' ')} left`);
      }
    };
    
    calculateProgress();
    const interval = setInterval(calculateProgress, 1000);
    return () => clearInterval(interval);
  }, [task?.startTime, task?.deadline, task?.status]);

  if (!task) return null;

  const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;
  const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const statusColor = getStatusColor(task.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
      footer={
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <div style={{ flex: 1 }} />
          {task.status !== 'done' && task.status !== 'overdue' && (!task.subtasks || task.subtasks.length === 0) && onStatusChange && (
            <Button 
              leftIcon={<CheckCircle2 size={16} />} 
              onClick={() => { onStatusChange(task._id, 'done'); onClose(); }}
              style={{ background: 'var(--color-success)', color: 'white', borderColor: 'var(--color-success)' }}
            >
              Mark as Done
            </Button>
          )}
          {task.status === 'done' && onStatusChange && (
            <Button 
              leftIcon={<Repeat size={16} />} 
              onClick={() => { onStatusChange(task._id, 'in-progress'); onClose(); }}
            >
              Reopen
            </Button>
          )}
          {task.status !== 'overdue' && (
            <Button leftIcon={<Edit2 size={16} />} onClick={() => { onClose(); onEdit(task); }}>
              Edit Task
            </Button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Title & Status Badge */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40`,
            }}>
              {statusLabels[task.status] || task.status}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              background: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority),
              border: `1px solid ${getPriorityColor(task.priority)}40`,
            }}>
              {priorityLabels[task.priority]}
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {task.title}
          </h2>
        </div>

        {/* Description */}
        {task.description && (
          <div style={{ 
            padding: '14px', borderRadius: '10px', 
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-default)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
              <FileText size={14} /> Description
            </div>
            <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.6 }}>
              {task.description}
            </p>
          </div>
        )}

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {task.startTime && (
            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-info)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                <Clock size={13} /> START TIME
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
                {new Date(task.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          )}
          {task.deadline && (
            <div style={{ padding: '12px', borderRadius: '10px', background: task.status === 'overdue' ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)', border: `1px solid ${task.status === 'overdue' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: task.status === 'overdue' ? 'var(--color-danger)' : 'var(--color-warning)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                <Calendar size={13} /> DEADLINE
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
                {new Date(task.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          )}
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
              <Zap size={13} /> ENERGY
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
              {energyLabels[task.energyRequired]}
            </div>
          </div>
          {task.recurring?.isRecurring && (
            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-info)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                <Repeat size={13} /> RECURRING
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>
                {task.recurring.frequency}
              </div>
            </div>
          )}
        </div>

        {/* Time Progress Bar */}
        {(task.status === 'done' || (task.startTime && task.deadline)) && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Time Progress
                {task.status === 'done' ? (
                  <span style={{ color: 'var(--color-success)' }}>
                    {task.completedAt
                      ? `Completed at ${new Date(task.completedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                      : 'Completed'}
                  </span>
                ) : (
                  timeLeft && <span style={{ color: 'var(--color-info)' }}>{timeLeft}</span>
                )}
              </span>
              <span style={{ color: task.status === 'done' ? 'var(--color-success)' : progress >= 100 ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                {task.status === 'done' ? '100.00%' : `${progress.toFixed(2)}%`}
              </span>
            </div>
            <div style={{ height: '8px', width: '100%', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
              <div style={{
                height: '100%', width: task.status === 'done' ? '100%' : `${progress}%`,
                background: task.status === 'done' ? 'var(--color-success)' : progress >= 100 ? 'var(--color-danger)' : 'linear-gradient(90deg, var(--color-primary), var(--color-info))',
                borderRadius: '999px', transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}

        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                <ListTodo size={15} /> Subtasks
              </div>
              <span style={{ 
                padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                background: subtaskPercent === 100 ? 'rgba(34,197,94,0.15)' : 'rgba(14,165,233,0.15)',
                color: subtaskPercent === 100 ? 'var(--color-success)' : 'var(--color-info)',
              }}>
                {completedSubtasks}/{totalSubtasks} ({subtaskPercent}%)
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {task.subtasks.map((st, idx) => (
                <div 
                  key={idx} 
                  onClick={() => task.status !== 'overdue' && onSubtaskToggle && onSubtaskToggle(task._id, idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '8px',
                    background: st.isCompleted ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${st.isCompleted ? 'rgba(34,197,94,0.2)' : 'var(--border-default)'}`,
                    cursor: (onSubtaskToggle && task.status !== 'overdue') ? 'pointer' : 'default',
                    opacity: task.status === 'overdue' ? 0.7 : 1,
                  }}
                >
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: st.isCompleted ? 'var(--color-success)' : 'transparent',
                    border: st.isCompleted ? 'none' : '2px solid var(--text-muted)',
                    color: 'white',
                  }}>
                    {st.isCompleted && <CheckCircle2 size={14} />}
                  </div>
                  <span style={{
                    fontSize: '14px', color: st.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: st.isCompleted ? 'line-through' : 'none',
                    flex: 1
                  }}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              <Tag size={14} /> Tags
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {task.tags.map((tag, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                  background: 'rgba(14,165,233,0.1)', color: 'var(--color-primary-light)',
                  border: '1px solid rgba(14,165,233,0.2)',
                }}>
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Created / Completed timestamps */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-default)', paddingTop: '12px' }}>
          {task.createdAt && (
            <span>Created: {new Date(task.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
          )}
          {task.completedAt && (
            <span>Completed: {new Date(task.completedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
          )}
        </div>
      </div>
    </Modal>
  );
};
