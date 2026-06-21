import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock3,
  Edit2,
  ListTodo,
  MoreVertical,
  Repeat,
  Sparkles,
  Tag,
  Trash2,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatRelativeDate, getPriorityColor, getStatusColor } from '@/lib/utils';
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from '@/lib/gsapConfig';
import { useGSAP } from '@gsap/react';
import styles from './TaskCard.module.css';

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
  completedAt?: string;
  createdAt?: string;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onSubtaskToggle?: (id: string, index: number) => void;
  onView?: (task: Task) => void;
}

const statusMeta = {
  todo: {
    label: 'To do',
    Icon: ListTodo,
    className: styles.statusTodo,
  },
  'in-progress': {
    label: 'In progress',
    Icon: Zap,
    className: styles.statusInProgress,
  },
  done: {
    label: 'Completed',
    Icon: CheckCircle2,
    className: styles.statusDone,
  },
  overdue: {
    label: 'Overdue',
    Icon: AlertTriangle,
    className: styles.statusOverdue,
  },
} satisfies Record<Task['status'], { label: string; Icon: typeof ListTodo; className: string }>;

const priorityLabels: Record<Task['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const energyLabels: Record<Task['energyRequired'], string> = {
  low: 'Low energy',
  medium: 'Medium energy',
  high: 'High energy',
};

type TaskCardStyle = CSSProperties &
  Record<'--priority-color' | '--status-color' | '--progress', string>;

export const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onSubtaskToggle,
  onView,
}: TaskCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const priorityColor = getPriorityColor(task.priority);
  const statusColor = getStatusColor(task.status);
  const isDone = task.status === 'done';
  const hasSubtasks = Boolean(task.subtasks?.length);
  const completedSubtasks = task.subtasks?.filter((subtask) => subtask.isCompleted).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  const previewSubtasks = task.subtasks?.slice(0, 3) ?? [];
  const hiddenSubtasks = Math.max(totalSubtasks - previewSubtasks.length, 0);
  const status = statusMeta[task.status];
  const StatusIcon = status.Icon;
  const displayProgress = hasSubtasks ? subtaskProgress : Math.round(progress);

  const formatDateTimeRange = (start?: string, end?: string) => {
    if (!start && !end) return '';
    const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const formatDate = (d: string) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    if (start && end) {
      const isSameDay = new Date(start).toDateString() === new Date(end).toDateString();
      if (isSameDay) {
        return `${formatDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
      } else {
        return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
      }
    }
    if (end) return `Due ${formatDate(end)} ${formatTime(end)}`;
    if (start) return `Starts ${formatDate(start)} ${formatTime(start)}`;
    return '';
  };

  const cardStyle = {
    '--priority-color': priorityColor,
    '--status-color': statusColor,
    '--progress': `${displayProgress}%`,
  } as TaskCardStyle;

  useEffect(() => {
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
      const resetTimer = window.setTimeout(() => {
        setProgress(0);
        setTimeLeft('');
      }, 0);

      return () => window.clearTimeout(resetTimer);
    }



    const calculateProgress = () => {
      const start = new Date(task.startTime!).getTime();
      const end = new Date(task.deadline!).getTime();
      const now = Date.now();

      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
        setProgress(now >= end ? 100 : 0);
        setTimeLeft(now >= end ? 'Time is up' : '');
        return;
      }

      if (now <= start) {
        setProgress(0);
        setTimeLeft('Not started yet');
        return;
      }

      if (now >= end) {
        setProgress(100);
        setTimeLeft('Time is up');
        return;
      }

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
    };

    calculateProgress();
    const interval = window.setInterval(calculateProgress, 1000);

    return () => window.clearInterval(interval);
  }, [task.startTime, task.deadline, task.status, task.completedAt]);

  useEffect(() => {
    if (!showMenu) return;

    const closeMenu = () => setShowMenu(false);

    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);

    return () => {
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [showMenu]);

  useGSAP(
    () => {
      if (!cardRef.current) return;

      gsap.fromTo(
        cardRef.current,
        { autoAlpha: 0, y: 18, rotateX: -3 },
        {
          autoAlpha: isDone ? 0.72 : 1,
          y: 0,
          rotateX: 0,
          duration: 0.5,
          ease: 'power3.out',
          clearProps: 'y,rotateX',
        }
      );

      gsap.fromTo(
        cardRef.current.querySelectorAll('[data-card-reveal]'),
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.38,
          stagger: 0.045,
          delay: 0.08,
          ease: 'power2.out',
        }
      );
    },
    { scope: cardRef, dependencies: [task._id] }
  );

  useGSAP(
    () => {
      if (!cardRef.current) return;

      gsap.to(cardRef.current, {
        autoAlpha: isDone ? 0.72 : 1,
        scale: isDone ? 0.985 : 1,
        duration: 0.28,
        ease: 'power2.out',
      });

      if (isDone && statusButtonRef.current) {
        gsap.fromTo(
          statusButtonRef.current,
          { scale: 0.82 },
          { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.55)' }
        );
      }
    },
    { scope: cardRef, dependencies: [isDone] }
  );

  const toggleStatus = () => {
    if (task.status === 'done' || task.status === 'todo' || task.status === 'overdue') {
      return;
    }

    onStatusChange(task._id, 'done');
  };

  const shouldReduceMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || shouldReduceMotion()) return;

    const bounds = cardRef.current.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const xPercent = Math.min(Math.max(x / bounds.width, 0), 1);
    const yPercent = Math.min(Math.max(y / bounds.height, 0), 1);

    gsap.to(cardRef.current, {
      rotateX: (0.5 - yPercent) * 4,
      rotateY: (xPercent - 0.5) * 5,
      y: -4,
      scale: 1.01,
      duration: 0.35,
      ease: 'power2.out',
      transformPerspective: 900,
      transformOrigin: 'center',
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || shouldReduceMotion()) return;

    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      y: 0,
      scale: isDone ? 0.985 : 1,
      duration: 0.45,
      ease: 'elastic.out(1, 0.65)',
    });
  };

  const handleCardClick = () => {
    if (onView) {
      onView(task);
    }
  };

  const positionMenu = () => {
    if (!menuButtonRef.current) return;

    const buttonBounds = menuButtonRef.current.getBoundingClientRect();
    const panelWidth = 220;
    const panelHeight = 196;
    const spacing = 10;
    const viewportPadding = 12;
    const availableBelow = window.innerHeight - buttonBounds.bottom - spacing;
    const top =
      availableBelow >= panelHeight
        ? buttonBounds.bottom + spacing
        : Math.max(viewportPadding, buttonBounds.top - panelHeight - spacing);
    const left = Math.min(
      Math.max(viewportPadding, buttonBounds.right - panelWidth),
      window.innerWidth - panelWidth - viewportPadding
    );

    setMenuPosition({ top, left });
  };

  const handleMenuToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (showMenu) {
      setShowMenu(false);
      return;
    }

    positionMenu();
    setShowMenu(true);
  };

  const menuPanel = showMenu && typeof document !== 'undefined' && createPortal(
    <>
      <button
        type="button"
        className={styles.menuBackdrop}
        aria-label="Close task menu"
        onClick={(event) => {
          event.stopPropagation();
          setShowMenu(false);
        }}
      />
      <div
        className={styles.menuPanel}
        style={{ top: menuPosition.top, left: menuPosition.left }}
        onClick={(event) => event.stopPropagation()}
      >
        {task.status !== 'overdue' && (
          <button
            type="button"
            className={styles.menuAction}
            onClick={() => {
              setShowMenu(false);
              onEdit(task);
            }}
          >
            <Edit2 size={16} />
            Edit Task
          </button>
        )}

        <button
          type="button"
          className={`${styles.menuAction} ${styles.menuActionDanger}`}
          onClick={() => {
            setShowMenu(false);
            onDelete(task._id);
          }}
        >
          <Trash2 size={16} />
          Delete Task
        </button>
      </div>
    </>,
    document.body
  );

  return (
    <div
      ref={cardRef}
      className={styles.wrapper}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={cardStyle}
    >
      <Card padding="none" hover className={styles.previewCard} onClick={handleCardClick}>
        <div className={styles.priorityRail} aria-hidden="true" />

        <div className={styles.cardInner}>
          <div className={styles.topRow} data-card-reveal>
            {!hasSubtasks && (
              <button
                ref={statusButtonRef}
                type="button"
                disabled={task.status === 'todo' || task.status === 'overdue' || task.status === 'done'}
                className={`${styles.statusToggle} ${isDone ? styles.statusToggleDone : ''} ${task.status === 'overdue' ? styles.statusToggleOverdue : ''}`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleStatus();
                }}
                title={task.status === 'overdue' ? 'Overdue tasks are locked' : task.status === 'todo' ? 'Task must be in progress to complete' : task.status === 'done' ? 'Completed tasks cannot be reopened' : 'Toggle completion'}
                aria-label={task.status === 'done' ? 'Completed' : 'Mark task as done'}
              >
                <CheckCircle2 size={18} strokeWidth={2.4} />
              </button>
            )}

            <div className={styles.badgeCluster}>
              <span className={`${styles.statusBadge} ${status.className}`}>
                <StatusIcon size={13} />
                {status.label}
              </span>
              <span className={styles.priorityBadge}>
                <span className={styles.priorityDot} />
                {priorityLabels[task.priority]} priority
              </span>
            </div>

            <div className={styles.menuWrap}>
              <button
                ref={menuButtonRef}
                type="button"
                className={styles.menuButton}
                onClick={handleMenuToggle}
                title="More options"
                aria-label="Task options"
                aria-expanded={showMenu}
              >
                <MoreVertical size={18} />
              </button>
              {menuPanel}
            </div>
          </div>

          <div className={styles.titleBlock} data-card-reveal>
            <h4 className={`${styles.title} ${isDone ? styles.titleDone : ''}`}>{task.title}</h4>
            {task.description && <p className={styles.description}>{task.description}</p>}
          </div>

          <div className={styles.infoGrid} data-card-reveal>
            {(task.startTime || task.deadline) && (
              <div className={`${styles.infoChip} ${task.status === 'overdue' ? styles.infoChipDanger : ''}`}>
                <Calendar size={14} />
                <span>{formatDateTimeRange(task.startTime, task.deadline)}</span>
              </div>
            )}

            <div className={`${styles.infoChip} ${styles.infoChipEnergy}`}>
              <Zap size={14} />
              <span>{energyLabels[task.energyRequired]}</span>
            </div>

            {hasSubtasks && (
              <div className={`${styles.infoChip} ${styles.infoChipSubtasks}`}>
                <ListTodo size={14} />
                <span>
                  {completedSubtasks}/{totalSubtasks} done
                </span>
              </div>
            )}

            {task.recurring?.isRecurring && (
              <div className={styles.infoChip}>
                <Repeat size={14} />
                <span>{task.recurring.frequency}</span>
              </div>
            )}
          </div>

          {task.suggestedTime && !isDone && (
            <div className={styles.aiStrip} data-card-reveal>
              <Sparkles size={15} />
              <span>
                AI suggests{' '}
                {new Date(task.suggestedTime.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {/* Time Progress Block */}
          {((task.startTime && task.deadline) || isDone) && (
            <div className={styles.progressBlock} data-card-reveal>
              <div className={styles.progressHeader}>
                <span>Time Progress</span>
                <strong style={{
                  color: isDone
                    ? 'var(--color-success-light)'
                    : progress >= 100
                      ? 'var(--color-danger-light)'
                      : 'var(--text-muted)',
                }}>
                  {timeLeft} {!isDone && `(${progress.toFixed(2)}%)`}
                </strong>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${progress}%`,
                    background: isDone
                      ? 'var(--color-success)'
                      : progress >= 100
                        ? 'rgba(239, 68, 68, 0.5)'
                        : undefined,
                  }}
                />
              </div>
            </div>
          )}

          {/* Checklist Progress Block */}
          {hasSubtasks && (
            <div className={styles.progressBlock} data-card-reveal>
              <div className={styles.progressHeader}>
                <span>Checklist Progress</span>
                <strong style={{ color: subtaskProgress === 100 ? 'var(--color-success-light)' : '' }}>
                  {subtaskProgress}%
                </strong>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${subtaskProgress}%`,
                    background: subtaskProgress === 100 ? 'var(--color-success)' : undefined,
                  }}
                />
              </div>
            </div>
          )}

          {previewSubtasks.length > 0 && (
            <div className={styles.subtaskPreview} data-card-reveal>
              {previewSubtasks.map((subtask, index) => (
                <div key={`${subtask.title}-${index}`} className={styles.subtaskItem}>
                  <span className={`${styles.subtaskDot} ${subtask.isCompleted ? styles.subtaskDotDone : ''}`}>
                    {subtask.isCompleted && <CheckCircle2 size={12} />}
                  </span>
                  <span className={subtask.isCompleted ? styles.subtaskTextDone : ''}>{subtask.title}</span>
                  {onSubtaskToggle && (
                    <button
                      type="button"
                      disabled={task.status === 'todo' || task.status === 'overdue'}
                      className={styles.subtaskToggle}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSubtaskToggle(task._id, index);
                      }}
                      title={task.status === 'overdue' ? 'Overdue tasks are locked' : task.status === 'todo' ? 'Task must be in progress to complete subtasks' : 'Toggle subtask'}
                      aria-label={subtask.isCompleted ? 'Reopen subtask' : 'Complete subtask'}
                    >
                      {subtask.isCompleted ? <Repeat size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                  )}
                </div>
              ))}
              {hiddenSubtasks > 0 && <span className={styles.moreSubtasks}>+{hiddenSubtasks} more</span>}
            </div>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className={styles.tagList} data-card-reveal>
              {task.tags.slice(0, 4).map((tag) => (
                <span key={tag} className={styles.tagChip}>
                  <Tag size={11} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
