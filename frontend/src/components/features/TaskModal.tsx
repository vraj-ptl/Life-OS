import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Zap, Clock, Flag, Calendar, FileText, Tag, ListTodo, Repeat, X, Plus } from 'lucide-react';

interface Subtask {
  title: string;
  isCompleted: boolean;
}

interface Task {
  _id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'done' | 'overdue';
  deadline: string;
  energyRequired: 'low' | 'medium' | 'high';
  estimatedDuration: number;
  tags: string[];
  subtasks: Subtask[];
  recurring: {
    isRecurring: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  };
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task | null;
  isLoading?: boolean;
}

export const TaskModal = ({ isOpen, onClose, onSave, task, isLoading = false }: TaskModalProps) => {
  const defaultTask: Partial<Task> = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    deadline: '',
    energyRequired: 'medium',
    estimatedDuration: 30,
    tags: [],
    subtasks: [],
    recurring: { isRecurring: false, frequency: 'daily' },
  };

  const [formData, setFormData] = useState<Partial<Task>>(defaultTask);
  const [tagInput, setTagInput] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        ...defaultTask,
        ...task,
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
      });
    } else {
      setFormData(defaultTask);
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

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags?.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter(tag => tag !== tagToRemove) });
  };

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      setFormData({
        ...formData,
        subtasks: [...(formData.subtasks || []), { title: subtaskInput.trim(), isCompleted: false }],
      });
      setSubtaskInput('');
    }
  };

  const handleRemoveSubtask = (index: number) => {
    const newSubtasks = [...(formData.subtasks || [])];
    newSubtasks.splice(index, 1);
    setFormData({ ...formData, subtasks: newSubtasks });
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
            className="w-full min-h-[80px] bg-input border-[1.5px] border-border-default rounded-md p-3 text-primary text-base focus:border-primary focus:ring-[3px] focus:ring-primary/10 outline-none transition-all resize-none"
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
            <label className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <Zap size={16} /> Energy Level
            </label>
            <select
              className="w-full h-[44px] bg-input border-[1.5px] border-border-default rounded-md px-3 text-primary text-base focus:border-primary focus:ring-[3px] focus:ring-primary/10 outline-none transition-all"
              value={formData.energyRequired}
              onChange={(e) => setFormData({ ...formData, energyRequired: e.target.value as any })}
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🔵 Medium</option>
              <option value="high">🟡 High</option>
            </select>
          </div>
        </div>
        
        {/* Subtasks */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
            <ListTodo size={16} /> Subtasks
          </label>
          <div className="flex flex-col gap-2">
            {formData.subtasks?.map((subtask, index) => (
              <div key={index} className="flex items-center justify-between bg-input border border-border-default rounded-md p-2 px-3">
                <span className="text-sm text-primary">{subtask.title}</span>
                <button 
                  type="button" 
                  onClick={() => handleRemoveSubtask(index)}
                  className="text-muted hover:text-danger"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add subtask..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                className="flex-1 h-[40px] bg-input border-[1.5px] border-border-default rounded-md px-3 text-sm text-primary focus:border-primary outline-none transition-all"
              />
              <Button type="button" variant="secondary" onClick={handleAddSubtask} className="h-[40px] px-3">
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
            <Tag size={16} /> Tags
          </label>
          <div className="flex flex-wrap items-center gap-2 bg-input border-[1.5px] border-border-default rounded-md p-2 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/10 transition-all">
            {formData.tags?.map((tag) => (
              <div key={tag} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-danger rounded-full">
                  <X size={12} />
                </button>
              </div>
            ))}
            <input
              type="text"
              placeholder="Add tag & press Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="flex-1 min-w-[120px] bg-transparent text-sm text-primary outline-none"
            />
          </div>
        </div>

        {/* Recurring Settings */}
        <div className="flex items-center gap-4 bg-input border-[1.5px] border-border-default rounded-md p-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-primary">
            <input
              type="checkbox"
              checked={formData.recurring?.isRecurring || false}
              onChange={(e) => setFormData({
                ...formData,
                recurring: { ...(formData.recurring as any), isRecurring: e.target.checked }
              })}
              className="w-4 h-4 rounded border-border-default text-primary focus:ring-primary"
            />
            <Repeat size={16} /> Recurring Task
          </label>
          
          {formData.recurring?.isRecurring && (
            <select
              className="flex-1 h-[36px] bg-background border-[1.5px] border-border-default rounded-md px-3 text-sm text-primary outline-none"
              value={formData.recurring.frequency}
              onChange={(e) => setFormData({
                ...formData,
                recurring: { ...formData.recurring, isRecurring: true, frequency: e.target.value as any }
              })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          )}
        </div>
      </form>
    </Modal>
  );
};

