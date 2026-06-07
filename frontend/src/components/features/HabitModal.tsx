import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Sparkles, Type, Hash, Timer, Target, Clock } from 'lucide-react';
import styles from './HabitModal.module.css';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: any) => void;
  habit?: any;
  isLoading?: boolean;
}

const ICONS = ['✨', '🏃', '💧', '📚', '🧘', '🥗', '💊', '💪', '🧠', '💰', '🎵', '🎨'];
const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const createDefaultHabit = () => ({
  name: '',
  icon: '✨',
  color: '#8b5cf6',
  category: 'other',
  frequency: 'daily',
  timeOfDay: 'morning',
  trackingType: 'boolean',
  targetValue: 1,
  unit: '',
});

export const HabitModal = ({ isOpen, onClose, onSave, habit, isLoading = false }: HabitModalProps) => {
  const [formData, setFormData] = useState(createDefaultHabit());

  useEffect(() => {
    if (isOpen) {
      if (habit) {
        setFormData({ ...createDefaultHabit(), ...habit });
      } else {
        setFormData(createDefaultHabit());
      }
    }
  }, [isOpen, habit]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a habit name');
      return;
    }
    
    // Force boolean for all new/edited habits since complex tracking was removed
    const dataToSave = { ...formData, trackingType: 'boolean', targetValue: 1, unit: '' };

    onSave(dataToSave);
  };

  const handleInputChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const isEdit = Boolean(habit);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Habit' : 'Create Habit'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {isEdit ? 'Save Changes' : 'Create Habit'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        
        {/* Habit Name */}
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label className={styles.label} htmlFor="habit-name">
            <Sparkles size={15} />
            Habit name
          </label>
          <input
            id="habit-name"
            className={styles.input}
            value={formData.name}
            onChange={handleInputChange('name')}
            placeholder="e.g. Drink 2L of water"
            required
            autoFocus
          />
        </div>

        {/* Time of Day */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="habit-time-of-day">
            <Clock size={15} />
            Time of Day
          </label>
          <select
            id="habit-time-of-day"
            className={styles.input}
            value={formData.timeOfDay}
            onChange={handleInputChange('timeOfDay')}
          >
            <option value="morning">Morning Routine (00:00 - 11:59)</option>
            <option value="afternoon">Afternoon Routine (12:00 - 16:59)</option>
            <option value="evening">Evening Routine (17:00 - 20:59)</option>
            <option value="night">Night Routine (21:00 - 23:59)</option>
          </select>
        </div>

        {/* Category & Frequency */}
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="habit-category">
              <Hash size={15} />
              Category
            </label>
            <select
              id="habit-category"
              className={styles.input}
              value={formData.category}
              onChange={handleInputChange('category')}
            >
              <option value="health">Health & Fitness</option>
              <option value="productivity">Productivity</option>
              <option value="learning">Learning</option>
              <option value="mindfulness">Mindfulness</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="habit-frequency">
              <Timer size={15} />
              Frequency
            </label>
            <select
              id="habit-frequency"
              className={styles.input}
              value={formData.frequency}
              onChange={handleInputChange('frequency')}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        {/* Icons */}
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label className={styles.label}>Choose an Icon</label>
          <div className="grid grid-cols-6 gap-2 p-3 bg-input border border-border-default rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.64)' }}>
            {ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                className="w-full aspect-square rounded-lg text-2xl flex items-center justify-center transition-all font-semibold"
                style={{
                  transform: formData.icon === icon ? 'scale(1.15)' : 'scale(1)',
                  background: formData.icon === icon ? 'rgba(14, 165, 233, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: formData.icon === icon ? '2px solid var(--color-primary)' : '1px solid transparent',
                  boxShadow: formData.icon === icon ? '0 0 15px rgba(14, 165, 233, 0.4)' : 'none',
                  zIndex: formData.icon === icon ? 10 : 1
                }}
                onClick={() => setFormData({ ...formData, icon })}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label className={styles.label}>Choose a Color</label>
          <div className="flex gap-3 p-3 bg-input border border-border-default rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.64)' }}>
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                className="w-10 h-10 rounded-full transition-all transform"
                style={{ 
                  backgroundColor: color,
                  transform: formData.color === color ? 'scale(1.25)' : 'scale(1)',
                  opacity: formData.color === color ? 1 : 0.7,
                  border: formData.color === color ? '2px solid white' : '2px solid transparent',
                  boxShadow: formData.color === color ? `0 0 15px ${color}80` : 'none',
                  zIndex: formData.color === color ? 10 : 1
                }}
                onClick={() => setFormData({ ...formData, color })}
              />
            ))}
          </div>
        </div>

      </form>
    </Modal>
  );
};
