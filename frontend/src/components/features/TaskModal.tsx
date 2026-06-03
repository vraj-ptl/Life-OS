import { useEffect, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import { Calendar, Clock, FileText, Flag, ListTodo, Plus, Repeat, Tag, X, Zap } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import styles from './TaskModal.module.css';

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
  startTime: string;
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

const priorityOptions: Array<{ value: Task['priority']; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const energyOptions: Array<{ value: Task['energyRequired']; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const frequencyOptions: Array<{ value: Task['recurring']['frequency']; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const createDefaultTask = (): Partial<Task> => ({
  title: '',
  description: '',
  priority: 'medium',
  status: 'todo',
  deadline: '',
  energyRequired: 'medium',
  startTime: '',
  tags: [],
  subtasks: [],
  recurring: { isRecurring: false, frequency: 'daily' },
});

const toLocalInputValue = (value?: string) => {
  if (!value) return '';

  return new Date(new Date(value).getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export const TaskModal = ({ isOpen, onClose, onSave, task, isLoading = false }: TaskModalProps) => {
  const [formData, setFormData] = useState<Partial<Task>>(createDefaultTask);
  const [tagInput, setTagInput] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const resetForm = window.setTimeout(() => {
      if (task) {
        setFormData({
          ...createDefaultTask(),
          ...task,
          startTime: toLocalInputValue(task.startTime),
          deadline: toLocalInputValue(task.deadline),
        });
      } else {
        setFormData(createDefaultTask());
      }

      setTagInput('');
      setSubtaskInput('');
    }, 0);

    return () => window.clearTimeout(resetForm);
  }, [task, isOpen]);

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();

    if (!formData.title?.trim()) {
      alert('Please enter a task title');
      return;
    }

    const dataToSave: Partial<Task> = { ...formData };

    if (dataToSave.startTime) {
      dataToSave.startTime = new Date(dataToSave.startTime).toISOString();
    } else {
      delete dataToSave.startTime;
    }

    if (dataToSave.deadline) {
      dataToSave.deadline = new Date(dataToSave.deadline).toISOString();
    } else {
      delete dataToSave.deadline;
    }

    onSave(dataToSave);
  };

  const handleAddTag = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    const nextTag = tagInput.trim();

    if (nextTag && !formData.tags?.includes(nextTag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), nextTag] });
    }

    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter((tag) => tag !== tagToRemove) });
  };

  const handleAddSubtask = () => {
    const nextSubtask = subtaskInput.trim();

    if (!nextSubtask) return;

    setFormData({
      ...formData,
      subtasks: [...(formData.subtasks || []), { title: nextSubtask, isCompleted: false }],
    });
    setSubtaskInput('');
  };

  const handleRemoveSubtask = (indexToRemove: number) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks?.filter((_, index) => index !== indexToRemove),
    });
  };

  const handlePriorityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, priority: event.target.value as Task['priority'] });
  };

  const handleEnergyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, energyRequired: event.target.value as Task['energyRequired'] });
  };

  const handleRecurringChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      recurring: {
        ...(formData.recurring || { isRecurring: false, frequency: 'daily' }),
        isRecurring: event.target.checked,
      },
    });
  };

  const handleFrequencyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      recurring: {
        ...(formData.recurring || { isRecurring: true, frequency: 'daily' }),
        isRecurring: true,
        frequency: event.target.value as Task['recurring']['frequency'],
      },
    });
  };

  const isEdit = Boolean(task);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Task' : 'Create Task'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={() => handleSubmit()} isLoading={isLoading}>
            {isEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label className={styles.label} htmlFor="task-title">
            <FileText size={15} />
            Task title
          </label>
          <input
            id="task-title"
            className={styles.input}
            value={formData.title || ''}
            onChange={(event) => setFormData({ ...formData, title: event.target.value })}
            placeholder="e.g. Learn MongoDB aggregation"
            required
            autoFocus
          />
        </div>

        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label className={styles.label} htmlFor="task-description">
            <FileText size={15} />
            Description
          </label>
          <textarea
            id="task-description"
            className={styles.textarea}
            placeholder="Add details, links, or notes..."
            value={formData.description || ''}
            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
          />
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="task-priority">
              <Flag size={15} />
              Priority
            </label>
            <select
              id="task-priority"
              className={styles.input}
              value={formData.priority || 'medium'}
              onChange={handlePriorityChange}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="task-energy">
              <Zap size={15} />
              Energy
            </label>
            <select
              id="task-energy"
              className={styles.input}
              value={formData.energyRequired || 'medium'}
              onChange={handleEnergyChange}
            >
              {energyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="task-start-time">
              <Clock size={15} />
              Start time
            </label>
            <input
              id="task-start-time"
              type="datetime-local"
              className={styles.input}
              value={formData.startTime || ''}
              onChange={(event) => setFormData({ ...formData, startTime: event.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="task-deadline">
              <Calendar size={15} />
              Deadline
            </label>
            <input
              id="task-deadline"
              type="datetime-local"
              className={styles.input}
              value={formData.deadline || ''}
              onChange={(event) => setFormData({ ...formData, deadline: event.target.value })}
            />
          </div>
        </div>

        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label className={styles.label} htmlFor="task-subtask">
            <ListTodo size={15} />
            Subtasks
          </label>
          {formData.subtasks && formData.subtasks.length > 0 && (
            <div className={styles.itemList}>
              {formData.subtasks.map((subtask, index) => (
                <div key={`${subtask.title}-${index}`} className={styles.listItem}>
                  <span>{subtask.title}</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemoveSubtask(index)}
                    aria-label="Remove subtask"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className={styles.inlineControl}>
            <input
              id="task-subtask"
              className={styles.input}
              value={subtaskInput}
              onChange={(event) => setSubtaskInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddSubtask();
                }
              }}
              placeholder="Add a subtask..."
            />
            <Button type="button" variant="secondary" onClick={handleAddSubtask} className={styles.addButton}>
              <Plus size={16} />
            </Button>
          </div>
        </div>

        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label className={styles.label} htmlFor="task-tag">
            <Tag size={15} />
            Tags
          </label>
          <div className={styles.tagBox}>
            {formData.tags?.map((tag) => (
              <span key={tag} className={styles.tagPill}>
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} aria-label={`Remove ${tag}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              id="task-tag"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag and press Enter..."
            />
          </div>
        </div>

        <div className={styles.recurringBox}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={Boolean(formData.recurring?.isRecurring)}
              onChange={handleRecurringChange}
              className={styles.checkbox}
            />
            <Repeat size={15} />
            Recurring task
          </label>

          {formData.recurring?.isRecurring && (
            <select
              className={`${styles.input} ${styles.frequencySelect}`}
              value={formData.recurring.frequency}
              onChange={handleFrequencyChange}
              aria-label="Recurring frequency"
            >
              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </form>
    </Modal>
  );
};
