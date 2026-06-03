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
        padding="0" 
        hover 
        className={`border-l-4 overflow-visible cursor-pointer rounded-[28px] ${isDone ? 'opacity-70' : 'shadow-[0_25px_80px_-35px_rgba(59,130,246,0.65)]'}`}
        style={{
          borderLeftColor: priorityColor,
          background: 'radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.10), transparent 30%), rgba(15, 23, 42, 0.96)'
        }}
        onClick={() => onView && onView(task)}
      >
        <div className="flex items-start justify-between gap-0 p-5">
          {/* Status Toggle - only show for tasks WITHOUT subtasks */}
          {!hasSubtasks && (
            <button 
              disabled={task.status === 'todo'}
              onClick={(e) => { e.stopPropagation(); toggleStatus(); }}
              title={task.status === 'todo' ? "Task must be in progress to complete" : "Toggle completion"}
              className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                task.status === 'todo' ? 'border-muted/50 cursor-not-allowed opacity-50' :
                isDone ? 'bg-success border-success text-white' : 'border-muted hover:border-primary text-transparent hover:text-primary-light'
              }`}
            >
              <CheckCircle2 size={16} className={isDone ? 'opacity-100' : task.status === 'todo' ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'} />
            </button>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 pl-4">
            {/* Status & Priority Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-wider ${
                task.status === 'done' ? 'bg-success/20 text-success border-success/35' :
                task.status === 'in-progress' ? 'bg-info/20 text-info border-info/35' :
                task.status === 'todo' ? 'bg-primary/20 text-primary-light border-primary/35' :
                'bg-danger/20 text-danger border-danger/35'
              }`}>
                {task.status === 'done' ? '✅ Completed' : task.status === 'in-progress' ? '⚡ In Progress' : task.status === 'todo' ? '📋 To Do' : '⏰ Overdue'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-wider border-white/20 bg-white/8" style={{ color: priorityColor }}>
                <span className="h-3 w-3 rounded-full" style={{ background: priorityColor }}></span>
                {task.priority} Priority
              </span>
            </div>

            {/* Title */}
            <h4 
              className={`text-lg font-bold mb-2 leading-tight ${isDone ? 'line-through text-white/50' : 'text-white'}`}
            >
              {task.title}
            </h4>
            
            {/* Description */}
            {task.description && (
              <p className="text-sm text-white/60 line-clamp-2 mb-4">
                {task.description}
              </p>
            )}

            {/* Info Badges Row */}
            <div className="flex flex-wrap items-center gap-2.5 mb-5">
              {task.deadline && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide border ${
                  task.status === 'overdue' 
                    ? 'bg-danger/15 text-danger border-danger/30' 
                    : 'bg-warning/15 text-warning border-warning/30'
                }`}>
                  <Calendar size={14} />
                  <span>{formatRelativeDate(task.deadline)}</span>
                </div>
              )}

              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide border ${
                task.energyRequired === 'high' ? 'bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/30' : 
                task.energyRequired === 'medium' ? 'bg-info/15 text-info border-info/30' : 
                'bg-success/15 text-success border-success/30'
              }`}>
                <Zap size={14} />
                <span>{task.energyRequired} Energy</span>
              </div>
              
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide bg-primary/15 text-primary-light border border-primary/30">
                  <ListTodo size={14} />
                  <span>{task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length}</span>
                </div>
              )}
              
              {task.recurring?.isRecurring && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide bg-info/15 text-info border border-info/30">
                  <Repeat size={14} />
                  <span>{task.recurring.frequency}</span>
                </div>
              )}
            </div>
            
            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {task.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-primary/15 text-primary-light border border-primary/30">
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* AI Suggestion Badge */}
            {task.suggestedTime && !isDone && (
              <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/35 text-xs text-primary-light font-semibold">
                <Zap size={14} className="text-primary" fill="currentColor" />
                <span>AI Suggests: {new Date(task.suggestedTime.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            )}

            {/* Progress Bar */}
            {!isDone && task.startTime && task.deadline && (
              <div className="mb-5 rounded-3xl border border-white/15 bg-white/8 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/70">Time Progress</span>
                    <span className="text-sm font-bold text-info">{progress.toFixed(0)}%</span>
                  </div>
                  {timeLeft && (
                    <span className="text-xs text-info/90 font-semibold">{timeLeft}</span>
                  )}
                  <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden border border-white/15">
                    <div 
                      className="h-full transition-all duration-1000 bg-gradient-to-r from-info via-primary to-success"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Subtasks List */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mb-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">Subtasks</p>
                {task.subtasks.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/8 p-3 rounded-lg border border-white/12 transition-colors hover:bg-white/12">
                    <span className={`text-sm font-medium ${st.isCompleted ? 'line-through text-white/40' : 'text-white/90'}`}>
                      {st.title}
                    </span>
                    <button 
                      disabled={task.status === 'todo'}
                      className={`p-2 rounded-lg transition-all ${
                        task.status === 'todo' ? 'text-white/30 cursor-not-allowed opacity-50' :
                        st.isCompleted ? 'text-warning hover:bg-warning/20' : 'text-success hover:bg-success/20'
                      }`}
                      onClick={(e) => { e.stopPropagation(); onSubtaskToggle && onSubtaskToggle(task._id, idx); }}
                      title={task.status === 'todo' ? 'Task must be in progress to complete subtasks' : st.isCompleted ? 'Undo Subtask' : 'Complete Subtask'}
                    >
                      {st.isCompleted ? <Repeat size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Context Menu */}
          <div className="relative pl-2">
            <button 
              className="p-2.5 text-white/50 hover:text-primary hover:bg-primary/15 rounded-lg transition-colors font-semibold"
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              title="More options"
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 top-full mt-3 w-52 bg-slate-900/95 border border-white/15 rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-2 animate-fade-in-scale transform-origin-top-right backdrop-blur-sm">

                  {task.status !== 'todo' && task.status !== 'done' && (
                    <button 
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-lg bg-warning/20 text-warning hover:bg-warning/40 transition-all border border-warning/30"
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onStatusChange(task._id, 'todo'); }}
                    >
                      <ListTodo size={16} /> Move to To Do
                    </button>
                  )}
                  {task.status !== 'done' && !hasSubtasks && (
                    <button 
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-lg bg-success/20 text-success hover:bg-success/40 transition-all border border-success/30"
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onStatusChange(task._id, 'done'); }}
                    >
                      <CheckCircle2 size={16} /> Mark as Done
                    </button>
                  )}
                  <button 
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-lg bg-primary/20 text-primary-light hover:bg-primary/40 transition-all border border-primary/30"
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(task); }}
                  >
                    <Edit2 size={16} /> Edit Task
                  </button>
                  <button 
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-lg bg-danger/20 text-danger hover:bg-danger/40 transition-all border border-danger/30"
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(task._id); }}
                  >
                    <Trash2 size={16} /> Delete Task
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
