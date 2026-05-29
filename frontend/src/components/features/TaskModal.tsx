import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Zap, Clock, Flag, Calendar } from 'lucide-react';

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
      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        <Input
          label="Task Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Learn MongoDB aggregation"
          required
          autoFocus
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-secondary ml-1">Description (Optional)</label>
          <textarea
            className="w-full min-h-[100px] bg-input border border-border-default rounded-md p-3 text-primary focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-y"
            placeholder="Add details, links, or notes..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-md">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary ml-1 flex items-center gap-2">
              <Flag size={14} /> Priority
            </label>
            <select
              className="h-12 bg-input border border-border-default rounded-md px-3 text-primary focus:border-primary outline-none transition-all"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            >
              <option value="low">Low (Green)</option>
              <option value="medium">Medium (Blue)</option>
              <option value="high">High (Yellow)</option>
              <option value="urgent">Urgent (Red)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary ml-1 flex items-center gap-2">
              <Calendar size={14} /> Deadline
            </label>
            <input
              type="datetime-local"
              className="h-12 bg-input border border-border-default rounded-md px-3 text-primary focus:border-primary outline-none transition-all"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary ml-1 flex items-center gap-2">
              <Clock size={14} /> Duration (mins)
            </label>
            <input
              type="number"
              min="5"
              step="5"
              className="h-12 bg-input border border-border-default rounded-md px-3 text-primary focus:border-primary outline-none transition-all"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 30 })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary ml-1 flex items-center gap-2">
              <Zap size={14} /> Energy Level
            </label>
            <div className="flex bg-input border border-border-default rounded-md overflow-hidden h-12">
              {['low', 'medium', 'high'].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`flex-1 flex items-center justify-center capitalize transition-colors ${
                    formData.energyRequired === level 
                      ? 'bg-primary/20 text-primary font-medium' 
                      : 'text-muted hover:bg-white/5'
                  }`}
                  onClick={() => setFormData({ ...formData, energyRequired: level as any })}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
