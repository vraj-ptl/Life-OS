import { Clock, Calendar, Zap, AlertCircle, CheckCircle2, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { getPriorityColor, getStatusColor, formatRelativeDate } from '@/lib/utils';
import { useState, useRef } from 'react';
import { gsap } from '@/lib/gsapConfig';
import { useGSAP } from '@gsap/react';

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'done' | 'overdue';
  deadline?: string;
  energyRequired: 'low' | 'medium' | 'high';
  estimatedDuration: number;
  suggestedTime?: {
    startTime: string;
    endTime: string;
    reason: string;
  };
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
}

export const TaskCard = ({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const priorityColor = getPriorityColor(task.priority);
  const statusColor = getStatusColor(task.status);
  const isDone = task.status === 'done';

  useGSAP(() => {
    if (isDone && cardRef.current) {
      gsap.to(cardRef.current, { opacity: 0.6, scale: 0.98, duration: 0.3 });
    } else if (cardRef.current) {
      gsap.to(cardRef.current, { opacity: 1, scale: 1, duration: 0.3 });
    }
  }, [isDone]);

  const toggleStatus = () => {
    if (task.status === 'done') {
      onStatusChange(task._id, 'todo');
    } else {
      onStatusChange(task._id, 'done');
    }
  };

  return (
    <div ref={cardRef} className="relative group animate-fade-in-up">
      <Card 
        padding="md" 
        hover 
        className={`border-l-4 overflow-visible ${isDone ? 'opacity-60' : ''}`}
        style={{ borderLeftColor: priorityColor }}
      >
        <div className="flex items-start justify-between gap-md">
          {/* Status Toggle */}
          <button 
            onClick={toggleStatus}
            className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isDone ? 'bg-success border-success text-white' : 'border-muted hover:border-primary text-transparent hover:text-primary-light'
            }`}
          >
            <CheckCircle2 size={16} className={isDone ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-base font-semibold mb-1 truncate transition-all ${isDone ? 'line-through text-muted' : 'text-primary'}`}>
              {task.title}
            </h4>
            
            {task.description && (
              <p className="text-sm text-secondary line-clamp-2 mb-3">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
              {task.deadline && (
                <div className={`flex items-center justify-center gap-1.5 ${task.status === 'overdue' ? 'text-danger' : ''}`}>
                  <Calendar size={14} className="mt-[-1px]" />
                  <span>{formatRelativeDate(task.deadline)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-1.5">
                <Clock size={14} className="mt-[-1px]" />
                <span>{task.estimatedDuration}m</span>
              </div>
              
              <div className="flex items-center justify-center gap-1.5" title={`Energy: ${task.energyRequired}`}>
                <Zap size={14} className={
                  task.energyRequired === 'high' ? 'text-warning' : 
                  task.energyRequired === 'medium' ? 'text-info' : 'text-success'
                } />
              </div>
            </div>

            {/* AI Suggestion Badge */}
            {task.suggestedTime && !isDone && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-glow/20 border border-primary/30 text-xs text-primary-light">
                <Zap size={12} className="text-primary" fill="currentColor" />
                <span>AI Suggests: {new Date(task.suggestedTime.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            )}
          </div>

          {/* Context Menu */}
          <div className="relative">
            <button 
              className="p-1 text-muted hover:text-primary rounded-md hover:bg-white/5 transition-colors"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={18} />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border-default rounded-md shadow-xl z-50 overflow-hidden py-1 animate-fade-in-scale transform-origin-top-right">
                  <button 
                    className="w-full text-left px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-white/5 flex items-center gap-2 transition-colors"
                    onClick={() => { setShowMenu(false); onEdit(task); }}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-sm text-danger-light hover:text-danger hover:bg-danger/10 flex items-center gap-2 transition-colors"
                    onClick={() => { setShowMenu(false); onDelete(task._id); }}
                  >
                    <Trash2 size={14} /> Delete
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
