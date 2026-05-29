import { Card } from '@/components/ui/Card';
import { Flame, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import { gsap } from '@/lib/gsapConfig';

interface Habit {
  _id: string;
  name: string;
  icon: string;
  color: string;
  currentStreak: number;
  longestStreak: number;
  completedDates: string[];
}

interface HabitCardProps {
  habit: Habit;
  isCompletedToday: boolean;
  onToggle: (id: string, date: string) => void;
  date: string; // The date we are checking against (usually today's string 'YYYY-MM-DD')
}

export const HabitCard = ({ habit, isCompletedToday, onToggle, date }: HabitCardProps) => {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    // Animate click
    gsap.fromTo(toggleRef.current, 
      { scale: 0.8 }, 
      { scale: 1, duration: 0.3, ease: 'back.out(2)' }
    );
    
    if (!isCompletedToday) {
      // If marking as done, do a little bounce on the icon
      gsap.fromTo(iconRef.current,
        { y: 5 },
        { y: 0, duration: 0.4, ease: 'bounce.out' }
      );
    }
    
    onToggle(habit._id, date);
  };

  return (
    <Card hover className="flex items-center justify-between p-sm">
      <div className="flex items-center gap-md">
        {/* Habit Icon Container */}
        <div 
          ref={iconRef}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
          style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
        >
          {habit.icon}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h4 className="font-semibold text-primary text-base">{habit.name}</h4>
          <div className="flex items-center gap-1.5 text-xs font-medium text-secondary">
            <Flame size={14} className={habit.currentStreak > 0 ? "text-warning" : "text-muted"} />
            <span className={habit.currentStreak > 0 ? "text-warning-light" : ""}>
              {habit.currentStreak} day streak
            </span>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        ref={toggleRef}
        onClick={handleToggle}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
          isCompletedToday 
            ? "bg-success border-success text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
            : "bg-input border-border-default text-muted hover:border-success-light hover:text-success-light"
        )}
      >
        {isCompletedToday ? <Check size={20} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-border-default" />}
      </button>
    </Card>
  );
};
