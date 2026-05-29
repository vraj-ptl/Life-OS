import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: any) => void;
  isLoading?: boolean;
}

const ICONS = ['✨', '🏃', '💧', '📚', '🧘', '🥗', '💊', '💪', '🧠', '💰', '🎵', '🎨'];
const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export const HabitModal = ({ isOpen, onClose, onSave, isLoading = false }: HabitModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '✨',
    color: '#8b5cf6',
    category: 'other',
    frequency: 'daily',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        icon: '✨',
        color: '#8b5cf6',
        category: 'other',
        frequency: 'daily',
      });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Habit"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            Create Habit
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        <Input
          label="Habit Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Drink 2L of water"
          required
          autoFocus
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-secondary ml-1">Icon</label>
          <div className="flex flex-wrap gap-2 p-2 bg-input border border-border-default rounded-md">
            {ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                className={`w-10 h-10 rounded-md text-xl flex items-center justify-center transition-all ${
                  formData.icon === icon ? 'bg-primary/20 scale-110' : 'hover:bg-white/5'
                }`}
                onClick={() => setFormData({ ...formData, icon })}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-secondary ml-1">Color</label>
          <div className="flex gap-3 p-2">
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full transition-all ${
                  formData.color === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, color })}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-secondary ml-1">Category</label>
          <select
            className="h-12 bg-input border border-border-default rounded-md px-3 text-primary focus:border-primary outline-none transition-all"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="health">Health & Fitness</option>
            <option value="productivity">Productivity</option>
            <option value="learning">Learning</option>
            <option value="mindfulness">Mindfulness</option>
            <option value="other">Other</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};
