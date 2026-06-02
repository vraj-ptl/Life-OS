import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Zap, Clock, Flag, Calendar, FileText } from 'lucide-react';

interface Task {
  _id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'done' | 'overdue';
  deadline: string;
  energyRequired: 'low' | 'medium' | 'high';
  estimatedDuration: number;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task | null;
  isLoading?: boolean;
}

export const TaskModal = ({ isOpen, onClose, onSave, task, isLoading = false }: TaskModalProps) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    deadline: '',
    energyRequired: 'medium',
    estimatedDuration: 30,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        deadline: '',
        energyRequired: 'medium',
        estimatedDuration: 30,
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Please enter a task title');
      return;
    }
    onSave(formData);
  };

  const isEdit = !!task;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Task' : 'Create New Task'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {isEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
        {/* Task Title */}
        <Input
          label="Task Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Learn MongoDB aggregation"
          required
          autoFocus
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
            <FileText size={16} /> Description (Optional)
          </label>
          <textarea
            className="w-full min-h-[100px] bg-input border-[1.5px] border-border-default rounded-md p-3 text-primary text-base focus:border-primary focus:ring-[3px] focus:ring-primary/10 outline-none transition-all resize-none"
            placeholder="Add details, links, or notes..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Priority, Duration & Energy in Grid */}
        <div className="grid grid-cols-2 gap-lg">
          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <Flag size={16} /> Priority
            </label>
            <select
              className="w-full h-[44px] bg-input border-[1.5px] border-border-default rounded-md px-3 text-primary text-base focus:border-primary focus:ring-[3px] focus:ring-primary/10 outline-none transition-all"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🔵 Medium</option>
              <option value="high">🟡 High</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <Clock size={16} /> Duration (mins)
            </label>
            <input
              type="number"
              min="5"
              step="5"
              className="w-full h-[44px] bg-input border-[1.5px] border-border-default rounded-md px-3 text-primary text-base focus:border-primary focus:ring-[3px] focus:ring-primary/10 outline-none transition-all"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 30 })}
            />
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
            <Calendar size={16} /> Deadline
          </label>
          <input
            type="datetime-local"
            className="w-full h-[44px] bg-input border-[1.5px] border-border-default rounded-md px-3 text-primary text-base focus:border-primary focus:ring-[3px] focus:ring-primary/10 outline-none transition-all"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>

        {/* Energy Level */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <Zap size={16} /> Energy Level Required
          </label>
          <div className="flex gap-2 bg-input border border-border-default rounded-lg p-1.5">
            {[
              { level: 'low', label: 'Low 🟢', color: 'bg-success' },
              { level: 'medium', label: 'Medium 🔵', color: 'bg-info' },
              { level: 'high', label: 'High 🟡', color: 'bg-warning' }
            ].map(({ level, label, color }) => (
              <button
                key={level}
                type="button"
                className={`flex-1 py-2 px-3 rounded-md font-semibold text-sm text-center transition-all ${
                  formData.energyRequired === level
                    ? `${color} text-white shadow-md`
                    : 'text-secondary hover:bg-white/5'
                }`}
                onClick={() => setFormData({ ...formData, energyRequired: level as any })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
