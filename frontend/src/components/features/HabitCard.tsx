import { CheckCircle2, Flame, MoreVertical, Edit2, Trash2, Clock3, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from '@/lib/gsapConfig';
import { useGSAP } from '@gsap/react';
import styles from './HabitCard.module.css';

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
  trackingType: 'boolean' | 'numeric' | 'timer';
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

interface HabitCardProps {
  habit: Habit;
  date: string; // The date we are checking against (YYYY-MM-DD)
  onToggle: (id: string, date: string, progress?: number) => void;
  onEdit?: (habit: Habit) => void;
  onDelete?: (id: string) => void;
  onView?: (habit: Habit) => void;
}

type HabitCardStyle = CSSProperties &
  Record<'--priority-color' | '--status-color' | '--progress', string>;

const getTimeRange = (timeOfDay: string): string => {
  switch (timeOfDay) {
    case 'morning': return '00:00 – 11:59';
    case 'afternoon': return '12:00 – 16:59';
    case 'evening': return '17:00 – 20:59';
    case 'night': return '21:00 – 23:59';
    default: return '';
  }
};

export const HabitCard = ({ habit, date, onToggle, onEdit, onDelete, onView }: HabitCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Time state
  const [timeState, setTimeState] = useState({
    status: 'active', // 'upcoming', 'active', 'expired'
    progress: 0,      // 0 to 100
    timeText: '',
  });

  // Find the log for the target date
  const todayLog = habit.logs?.find(log => log.date.startsWith(date));
  const isCompletedToday = todayLog?.isCompleted || false;

  const priorityColor = habit.color;
  const statusColor = isCompletedToday ? '#10b981' : '#94a3b8'; // Success or muted

  const cardStyle = {
    '--priority-color': priorityColor,
    '--status-color': statusColor,
    '--progress': `${timeState.progress}%`,
  } as HabitCardStyle;

  // Time Logic
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Ensure local time date string for comparison
      const todayStrLocal = now.toLocaleDateString('en-CA'); // gets YYYY-MM-DD in local time
      
      // If we are viewing a past or future date overall
      if (date !== todayStrLocal) {
        if (date < todayStrLocal) {
          setTimeState({ status: 'expired', progress: 100, timeText: 'Expired' });
        } else {
          setTimeState({ status: 'upcoming', progress: 0, timeText: 'Upcoming' });
        }
        return;
      }

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();
      const timeInMinutes = currentHour * 60 + currentMinute + currentSecond / 60;

      let startMin = 0;
      let endMin = 0;

      if (habit.timeOfDay === 'morning') {
        startMin = 0; // 00:00
        endMin = 12 * 60 - 1; 
      } else if (habit.timeOfDay === 'afternoon') {
        startMin = 12 * 60;
        endMin = 17 * 60 - 1; 
      } else if (habit.timeOfDay === 'evening') {
        startMin = 17 * 60;
        endMin = 21 * 60 - 1; 
      } else if (habit.timeOfDay === 'night') {
        startMin = 21 * 60;
        endMin = 24 * 60 - 1; // 23:59
      }

      let adjustedTimeInMinutes = timeInMinutes;

      let status = 'active';
      let progress = 0;
      let timeText = '';

      if (isCompletedToday) {
        status = 'active';
        progress = 100;
        if (todayLog?.completedAt) {
          const completedDate = new Date(todayLog.completedAt);
          const formattedTime = completedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          timeText = `Completed at ${formattedTime}`;
        } else {
          timeText = 'Completed';
        }
      } else if (adjustedTimeInMinutes < startMin) {
        status = 'upcoming';
        progress = 0;
        const minsUntil = Math.floor(startMin - adjustedTimeInMinutes);
        timeText = `Starts in ${Math.floor(minsUntil/60)}h ${minsUntil%60}m`;
      } else if (adjustedTimeInMinutes > endMin) {
        status = 'expired';
        progress = 100;
        timeText = 'Time Expired';
      } else {
        status = 'active';
        progress = ((adjustedTimeInMinutes - startMin) / (endMin - startMin)) * 100;
        const minsLeft = Math.floor(endMin - adjustedTimeInMinutes);
        timeText = `${Math.floor(minsLeft/60)}h ${minsLeft%60}m left`;
      }

      setTimeState({ status, progress, timeText });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [habit.timeOfDay, date, isCompletedToday, todayLog?.completedAt]);


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
          autoAlpha: isCompletedToday ? 0.8 : (timeState.status === 'expired' ? 0.5 : 1),
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
    { scope: cardRef, dependencies: [habit._id] }
  );

  useGSAP(
    () => {
      if (!cardRef.current) return;

      gsap.to(cardRef.current, {
        autoAlpha: isCompletedToday ? 0.8 : (timeState.status === 'expired' ? 0.5 : 1),
        scale: isCompletedToday ? 0.985 : 1,
        duration: 0.28,
        ease: 'power2.out',
      });

      if (isCompletedToday && statusButtonRef.current) {
        gsap.fromTo(
          statusButtonRef.current,
          { scale: 0.82 },
          { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.55)' }
        );
      }
    },
    { scope: cardRef, dependencies: [isCompletedToday, timeState.status] }
  );

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
      scale: isCompletedToday ? 0.985 : 1,
      duration: 0.45,
      ease: 'elastic.out(1, 0.65)',
    });
  };

  const positionMenu = () => {
    if (!menuButtonRef.current) return;

    const buttonBounds = menuButtonRef.current.getBoundingClientRect();
    const panelWidth = 220;
    const panelHeight = 120;
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
        aria-label="Close menu"
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
        {onEdit && (
          <button
            type="button"
            className={styles.menuAction}
            onClick={() => {
              setShowMenu(false);
              onEdit(habit);
            }}
          >
            <Edit2 size={16} />
            Edit Habit
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className={`${styles.menuAction} ${styles.menuActionDanger}`}
            onClick={() => {
              setShowMenu(false);
              onDelete(habit._id);
            }}
          >
            <Trash2 size={16} />
            Delete Habit
          </button>
        )}
      </div>
    </>,
    document.body
  );

  const toggleHabitAction = (e: MouseEvent) => {
    e.stopPropagation();
    
    // Prevent interaction if expired (and not already completed) or upcoming
    if ((timeState.status === 'expired' && !isCompletedToday) || timeState.status === 'upcoming') {
      return;
    }

    if (habit.trackingType === 'boolean') {
      onToggle(habit._id, date);
    } else {
      if (isCompletedToday) {
        onToggle(habit._id, date, 0); // Uncomplete
      } else {
        onToggle(habit._id, date, habit.targetValue); // Complete fully
      }
    }
  };

  const isLocked = (timeState.status === 'expired' && !isCompletedToday) || timeState.status === 'upcoming';

  const handleCardClick = () => {
    if (onView) onView(habit);
  };

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
            
            {/* Unified Toggle Button for all habit types */}
            <button
              ref={statusButtonRef}
              type="button"
              className={`${styles.statusToggle} ${isCompletedToday ? styles.statusToggleDone : ''}`}
              onClick={toggleHabitAction}
              disabled={isLocked}
              aria-label={isCompletedToday ? 'Mark habit as uncompleted' : 'Mark habit as done'}
              style={{
                ...(isCompletedToday ? { background: `linear-gradient(135deg, ${habit.color}, #111)` } : {}),
                opacity: isLocked ? 0.3 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer'
              }}
            >
              {isLocked && !isCompletedToday ? (
                <Clock3 size={18} strokeWidth={2.4} />
              ) : (
                <CheckCircle2 size={18} strokeWidth={2.4} />
              )}
            </button>
            
            <div className={styles.badgeCluster}>
              <span className={`${styles.statusBadge}`} style={{ color: habit.color, borderColor: `${habit.color}50`, background: `${habit.color}20` }}>
                <span className="text-sm mr-1">{habit.icon}</span> {habit.category}
              </span>
              <span className={styles.priorityBadge}>
                <Flame size={12} className={habit.currentStreak > 0 ? "text-warning" : "text-muted"} />
                {habit.currentStreak} streak
              </span>
              <span className={styles.priorityBadge} style={{textTransform: 'capitalize'}}>
                {habit.frequency}
              </span>
              <span className={styles.priorityBadge} style={{textTransform: 'capitalize'}}>
                {habit.timeOfDay}
              </span>
            </div>

            <div className={styles.menuWrap}>
              <button
                ref={menuButtonRef}
                type="button"
                className={styles.menuButton}
                onClick={handleMenuToggle}
                aria-label="Habit options"
              >
                <MoreVertical size={18} />
              </button>
              {menuPanel}
            </div>
          </div>

          <div className={styles.titleBlock} data-card-reveal>
            <h4 className={`${styles.title} ${isCompletedToday ? styles.titleDone : ''}`}>{habit.name}</h4>
          </div>

          {/* Time Range Info */}
          <div className={styles.infoGrid} data-card-reveal>
            <div className={styles.infoChip}>
              <Clock size={14} />
              <span>{getTimeRange(habit.timeOfDay)}</span>
            </div>
          </div>

          <div className={styles.progressBlock} data-card-reveal>
            <div className={styles.progressHeader}>
              <span>Time Remaining</span>
              <strong style={{ 
                color: isCompletedToday 
                  ? 'var(--color-success-light)'
                  : timeState.status === 'expired' 
                    ? 'var(--color-danger-light)' 
                    : timeState.status === 'upcoming' 
                      ? 'var(--text-muted)' 
                      : '' 
              }}>
                {timeState.timeText} {!isCompletedToday && `(${timeState.progress.toFixed(2)}%)`}
              </strong>
            </div>
            <div className={styles.progressTrack}>
              <div 
                className={styles.progressFill} 
                style={{ 
                  width: `${timeState.progress}%`,
                  background: isCompletedToday 
                    ? 'var(--color-success)'
                    : timeState.status === 'expired' 
                      ? 'rgba(239, 68, 68, 0.5)' 
                      : timeState.status === 'upcoming'
                        ? 'transparent'
                        : `linear-gradient(90deg, ${habit.color}50, ${habit.color})` 
                }} 
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
