import { Clock, Calendar, Zap, AlertCircle, CheckCircle2, MoreVertical, Edit2, Trash2, Tag, ListTodo, Repeat, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { getPriorityColor, getStatusColor, formatRelativeDate } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { gsap } from '@/lib/gsapConfig';
import { useGSAP } from '@gsap/react';

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
  energyRequired: 'low' | 'medium' | 'high';
  startTime?: string;
  suggestedTime?: {
    startTime: string;
    endTime: string;
    reason: string;
  };
  tags?: string[];
  subtasks?: Subtask[];
  recurring?: {
    isRecurring: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  };
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onSubtaskToggle?: (id: string, index: number) => void;
  onView?: (task: Task) => void;
}

export const TaskCard = ({ task, onEdit, onDelete, onStatusChange, onSubtaskToggle, onView }: TaskCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!task.startTime || !task.deadline || task.status === 'done') return;
    
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
        
        // Calculate time left
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
  }, [task.startTime, task.deadline, task.status]);

  const priorityColor = getPriorityColor(task.priority);
  const statusColor = getStatusColor(task.status);
  const isDone = task.status === 'done';
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  useGSAP(() => {
    if (isDone && cardRef.current) {
      gsap.to(cardRef.current, { opacity: 0.6, scale: 0.98, duration: 0.3 });
    } else if (cardRef.current) {
      gsap.to(cardRef.current, { opacity: 1, scale: 1, duration: 0.3 });
    }
  }, [isDone]);

  const toggleStatus = () => {
    if (task.status === 'done') {
      onStatusChange(task._id, 'in-progress');
    } else {
      onStatusChange(task._id, 'done');
    }
  };

  return (
    <div ref={cardRef} className="relative group animate-fade-in-up">
      <Card 
        padding="md" 
        hover 
        className={`border-l-4 overflow-visible cursor-pointer ${isDone ? 'opacity-60' : ''}`}
        style={{ borderLeftColor: priorityColor }}
        onClick={() => onView && onView(task)}
      >
        <div className="flex items-start justify-between gap-md">
          {/* Status Toggle - only show for tasks WITHOUT subtasks */}
          {!hasSubtasks && (
            <button 
              disabled={task.status === 'todo'}
              onClick={(e) => { e.stopPropagation(); toggleStatus(); }}
              title={task.status === 'todo' ? "Task must be in progress to complete" : "Toggle completion"}
              className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                task.status === 'todo' ? 'border-muted/50 cursor-not-allowed opacity-50' :
                isDone ? 'bg-success border-success text-white' : 'border-muted hover:border-primary text-transparent hover:text-primary-light'
              }`}
            >
              <CheckCircle2 size={16} className={isDone ? 'opacity-100' : task.status === 'todo' ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'} />
            </button>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 
              className={`text-base font-semibold mb-1 truncate transition-all ${isDone ? 'line-through text-muted' : 'text-primary'}`}
            >
              {task.title}
            </h4>
            
            {task.description && (
              <p className="text-sm text-secondary line-clamp-2 mb-3">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3 mb-1">
              {task.deadline && (
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border ${
                  task.status === 'overdue' 
                    ? 'bg-danger/10 text-danger border-danger/20' 
                    : 'bg-warning/10 text-warning border-warning/20'
                }`}>
                  <Calendar size={12} />
                  <span>{formatRelativeDate(task.deadline)}</span>
                </div>
              )}

              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border ${
                task.energyRequired === 'high' ? 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20' : 
                task.energyRequired === 'medium' ? 'bg-info/10 text-info border-info/20' : 
                'bg-success/10 text-success border-success/20'
              }`}>
                <Zap size={12} />
                <span className="capitalize">{task.energyRequired} Energy</span>
              </div>
              
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  <ListTodo size={12} />
                  <span>{task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length}</span>
                </div>
              )}
              
              {task.recurring?.isRecurring && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold bg-info/10 text-info border border-info/20">
                  <Repeat size={12} />
                  <span className="capitalize">{task.recurring.frequency}</span>
                </div>
              )}
            </div>
            
            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div style={{ marginTop: 'var(--space-sm)', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {task.tags.map((tag, i) => (
                  <span key={i} style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '4px', 
                    padding: '2px 6px', borderRadius: '4px', fontSize: '10px', 
                    fontWeight: 'var(--font-medium)', background: 'rgba(14, 165, 233, 0.1)', 
                    color: 'var(--color-primary-light)' 
                  }}>
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* AI Suggestion Badge */}
            {task.suggestedTime && !isDone && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-glow/20 border border-primary/30 text-xs text-primary-light">
                <Zap size={12} className="text-primary" fill="currentColor" />
                <span>AI Suggests: {new Date(task.suggestedTime.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            )}

            {/* Progress Bar */}
            {!isDone && task.startTime && task.deadline && (
              <div className="mt-4">
                <div className="flex justify-between items-center text-xs text-muted mb-1 font-medium">
                  <span className="flex items-center gap-2">
                    Time Progress
                    {timeLeft && <span className="text-info font-semibold">{timeLeft}</span>}
                  </span>
                  <span>{progress.toFixed(2)}%</span>
                </div>
                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border-default/50">
                  <div 
                    className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-danger' : 'bg-primary'}`} 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Interactive Subtasks List */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-4 space-y-2">
                {task.subtasks.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-black/5 p-2 rounded-md border border-border-default/30 transition-colors hover:bg-black/10">
                    <span className={`text-sm ${st.isCompleted ? 'line-through text-muted' : 'text-primary'}`}>
                      {st.title}
                    </span>
                    <button 
                      disabled={task.status === 'todo'}
                      className={`p-1.5 rounded-md transition-all ${
                        task.status === 'todo' ? 'text-muted/50 cursor-not-allowed opacity-50' :
                        st.isCompleted ? 'text-warning hover:bg-warning/20' : 'text-success hover:bg-success/20'
                      }`}
                      onClick={(e) => { e.stopPropagation(); onSubtaskToggle && onSubtaskToggle(task._id, idx); }}
                      title={task.status === 'todo' ? 'Task must be in progress to complete subtasks' : st.isCompleted ? 'Undo Subtask' : 'Complete Subtask'}
                    >
                      {st.isCompleted ? <Repeat size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Context Menu */}
          <div className="relative">
            <button 
              className="p-1 text-muted hover:text-primary rounded-md hover:bg-white/5 transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            >
              <MoreVertical size={18} />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border-default rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-1.5 animate-fade-in-scale transform-origin-top-right">

                  {task.status !== 'todo' && task.status !== 'done' && (
                    <button 
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg bg-warning/10 text-warning hover:bg-warning hover:text-white transition-all border border-warning/20"
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onStatusChange(task._id, 'todo'); }}
                    >
                      <ListTodo size={14} /> Move to To Do
                    </button>
                  )}
                  {task.status !== 'done' && !hasSubtasks && (
                    <button 
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg bg-success/10 text-success hover:bg-success hover:text-white transition-all border border-success/20"
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onStatusChange(task._id, 'done'); }}
                    >
                      <CheckCircle2 size={14} /> Mark as Done
                    </button>
                  )}
                  <button 
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all border border-primary/20"
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(task); }}
                  >
                    <Edit2 size={14} /> Edit Task
                  </button>
                  <button 
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all border border-danger/20"
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(task._id); }}
                  >
                    <Trash2 size={14} /> Delete Task
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
