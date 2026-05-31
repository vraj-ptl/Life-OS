import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';

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
    if (!formData.name.trim()) {
      alert('Please enter a habit name');
      return;
    }
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
        {/* Habit Name */}
        <Input
          label="Habit Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Drink 2L of water"
          required
          autoFocus
          leftIcon={<Sparkles size={18} />}
        />

        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-3">Choose an Icon</label>
          <div className="grid grid-cols-6 gap-2 p-3 bg-card border border-border-default rounded-lg">
            {ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                className={`w-full aspect-square rounded-lg text-2xl flex items-center justify-center transition-all font-semibold ${
                  formData.icon === icon 
                    ? 'bg-primary/30 ring-2 ring-primary scale-110' 
                    : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                }`}
                onClick={() => setFormData({ ...formData, icon })}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-3">Choose a Color</label>
          <div className="flex gap-3 p-3 bg-card border border-border-default rounded-lg">
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`w-10 h-10 rounded-full transition-all transform ${
                  formData.color === color 
                    ? 'ring-2 ring-white scale-125' 
                    : 'opacity-70 hover:opacity-100 hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, color })}
              />
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2">Category</label>
          <select
            className="w-full"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            <option value="health">🏥 Health & Fitness</option>
            <option value="productivity">⚡ Productivity</option>
            <option value="learning">📚 Learning</option>
            <option value="mindfulness">🧘 Mindfulness</option>
            <option value="other">📌 Other</option>
          </select>
        </div>

        {/* Frequency Selection */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2">Frequency</label>
          <div className="flex bg-card border border-border-default rounded-lg overflow-hidden">
            {['daily', 'weekly'].map((freq) => (
              <button
                key={freq}
                type="button"
                className={`flex-1 py-3 font-semibold text-sm capitalize transition-all ${
                  formData.frequency === freq
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-secondary hover:bg-white/10'
                }`}
                onClick={() => setFormData({ ...formData, frequency: freq })}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
