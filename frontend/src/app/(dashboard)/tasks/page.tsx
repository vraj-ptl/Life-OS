'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, isToday, isSameMonth } from 'date-fns';
import { getPriorityColor } from '@/lib/utils';
import { TaskCard } from '@/components/features/TaskCard';
import { TaskModal } from '@/components/features/TaskModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Plus, List, Layout, Calendar as CalendarIcon, Loader2, CheckSquare } from 'lucide-react';
import api from '@/lib/api';
import styles from './Tasks.module.css';

type ViewMode = 'list' | 'kanban' | 'calendar';

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  const { toast } = useToast();

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ tasks: any[] }>('/tasks');
      if (res.success && res.data) {
        setTasks(res.data.tasks);
      }
    } catch (error: any) {
      toast({ type: 'error', message: 'Failed to fetch tasks', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Real-time status transitions
  useEffect(() => {
    if (tasks.length === 0) return;

    const checkStatuses = () => {
      const now = Date.now();
      const updates: {id: string, newStatus: string, title: string}[] = [];
      
      const newTasks = tasks.map(task => {
        if (task.status === 'todo' && task.startTime && now >= new Date(task.startTime).getTime()) {
          updates.push({ id: task._id, newStatus: 'in-progress', title: task.title });
          return { ...task, status: 'in-progress' };
        }
        if (task.status !== 'done' && task.status !== 'overdue' && task.deadline && now >= new Date(task.deadline).getTime()) {
          updates.push({ id: task._id, newStatus: 'overdue', title: task.title });
          return { ...task, status: 'overdue' };
        }
        return task;
      });

      if (updates.length > 0) {
        setTasks(newTasks);
        updates.forEach(async (update) => {
          try {
            await api.put(`/tasks/${update.id}`, { status: update.newStatus });
            if (update.newStatus === 'in-progress') {
              toast({ type: 'info', message: 'Task Auto-Started!', description: `"${update.title}" is now in progress.` });
            } else if (update.newStatus === 'overdue') {
              toast({ type: 'error', message: 'Task Overdue!', description: `"${update.title}" missed its deadline.` });
            }
          } catch (e) {
            console.error('Failed auto status change', e);
          }
        });
      }
    };

    const interval = setInterval(checkStatuses, 10000); // Check every 10 seconds for real-time feel
    return () => clearInterval(interval);
  }, [tasks]);

  const handleSaveTask = async (taskData: any) => {
    try {
      if (taskData._id) {
        // Update
        const res = await api.put<{ task: any }>(`/tasks/${taskData._id}`, taskData);
        if (res.success && res.data) {
          setTasks(tasks.map(t => t._id === taskData._id ? res.data?.task : t));
          toast({ type: 'success', message: 'Task updated' });
        }
      } else {
        // Create
        const res = await api.post<{ task: any }>('/tasks', taskData);
        if (res.success && res.data) {
          setTasks([...tasks, res.data.task]);
          toast({ type: 'success', message: 'Task created', description: res.data.task.suggestedTime ? 'AI has suggested an optimal time!' : undefined });
        }
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (error: any) {
      toast({ type: 'error', message: 'Failed to save task', description: error.message });
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t._id !== id));
      toast({ type: 'success', message: 'Task deleted' });
    } catch (error: any) {
      toast({ type: 'error', message: 'Failed to delete task' });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic update
    setTasks(tasks.map(t => t._id === id ? { ...t, status: newStatus } : t));
    
    try {
      await api.put(`/tasks/${id}`, { status: newStatus });
      if (newStatus === 'done') {
        toast({ type: 'success', message: 'Task completed! +XP' });
      }
    } catch (error: any) {
      // Revert on error
      fetchTasks();
      toast({ type: 'error', message: 'Failed to update status' });
    }
  };

  const handleSubtaskToggle = async (id: string, subtaskIndex: number) => {
    const task = tasks.find(t => t._id === id);
    if (!task || !task.subtasks) return;
    
    const newSubtasks = [...task.subtasks];
    newSubtasks[subtaskIndex] = { ...newSubtasks[subtaskIndex], isCompleted: !newSubtasks[subtaskIndex].isCompleted };
    
    // Optimistic update
    setTasks(tasks.map(t => t._id === id ? { ...t, subtasks: newSubtasks } : t));
    
    try {
      await api.put(`/tasks/${id}`, { subtasks: newSubtasks });
    } catch (error: any) {
      fetchTasks();
      toast({ type: 'error', message: 'Failed to update subtask' });
    }
  };

  // Group tasks by status for List View
  const groupedTasks = {
    todo: tasks.filter(t => t.status === 'todo'),
    inProgress: tasks.filter(t => t.status === 'in-progress'),
    overdue: tasks.filter(t => t.status === 'overdue'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={`text-gradient ${styles.headerTitle}`}>Tasks</h1>
          <p className={styles.headerSubtitle}>Manage your work with AI scheduling</p>
        </div>

        <div className={styles.headerActions}>
          {/* View Toggles */}
          <div className={styles.viewToggles}>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'kanban' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban View"
            >
              <Layout size={18} />
            </button>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'calendar' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
            >
              <CalendarIcon size={18} />
            </button>
          </div>

          <Button 
            leftIcon={<Plus size={18} />} 
            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <CheckSquare size={32} />
          </div>
          <h3 className={styles.emptyTitle}>No tasks yet</h3>
          <p className={styles.emptySubtitle}>
            Create your first task and let Life OS's AI suggest the best time for you to complete it.
          </p>
          <Button onClick={() => { setEditingTask(null); setIsModalOpen(true); }}>
            Create First Task
          </Button>
        </div>
      ) : (
        <>
          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              {groupedTasks.overdue.length > 0 && (
                <section>
                  <h3 className={styles.sectionTitle} style={{ color: 'var(--color-danger)' }}>
                    <span className={styles.statusDot} style={{ background: 'var(--color-danger)' }}></span> Overdue
                  </h3>
                  <div className={styles.tasksGrid}>
                    {groupedTasks.overdue.map(task => (
                      <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} onSubtaskToggle={handleSubtaskToggle} />
                    ))}
                  </div>
                </section>
              )}

              {groupedTasks.inProgress.length > 0 && (
                <section>
                  <h3 className={styles.sectionTitle} style={{ color: 'var(--color-info)' }}>
                    <span className={styles.statusDot} style={{ background: 'var(--color-info)' }}></span> In Progress
                  </h3>
                  <div className={styles.tasksGrid}>
                    {groupedTasks.inProgress.map(task => (
                      <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} onSubtaskToggle={handleSubtaskToggle} />
                    ))}
                  </div>
                </section>
              )}

              {groupedTasks.todo.length > 0 && (
                <section>
                  <h3 className={styles.sectionTitle} style={{ color: 'var(--color-primary-light)' }}>
                    <span className={styles.statusDot} style={{ background: 'var(--color-primary-light)' }}></span> To Do
                  </h3>
                  <div className={styles.tasksGrid}>
                    {groupedTasks.todo.map(task => (
                      <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} onSubtaskToggle={handleSubtaskToggle} />
                    ))}
                  </div>
                </section>
              )}

              {groupedTasks.done.length > 0 && (
                <section>
                  <h3 className={styles.sectionTitle} style={{ color: 'var(--color-success)' }}>
                    <span className={styles.statusDot} style={{ background: 'var(--color-success)' }}></span> Completed
                  </h3>
                  <div className={styles.tasksGrid}>
                    {groupedTasks.done.map(task => (
                      <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} onSubtaskToggle={handleSubtaskToggle} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* KANBAN VIEW */}
          {viewMode === 'kanban' && (
            <div className={styles.kanbanBoard}>
              {/* To Do Column */}
              <div className={styles.kanbanColumn}>
                <div className={styles.kanbanHeader}>
                  <h3 className={styles.kanbanTitle} style={{ color: 'var(--color-primary-light)' }}>To Do</h3>
                  <span className={styles.kanbanCount}>{groupedTasks.todo.length}</span>
                </div>
                <div className={styles.kanbanList}>
                  {groupedTasks.todo.map(task => (
                    <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} onSubtaskToggle={handleSubtaskToggle} />
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div className={styles.kanbanColumn}>
                <div className={styles.kanbanHeader}>
                  <h3 className={styles.kanbanTitle} style={{ color: 'var(--color-info)' }}>In Progress</h3>
                  <span className={styles.kanbanCount}>{groupedTasks.inProgress.length}</span>
                </div>
                <div className={styles.kanbanList}>
                  {groupedTasks.inProgress.map(task => (
                    <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} onSubtaskToggle={handleSubtaskToggle} />
                  ))}
                </div>
              </div>

              {/* Done Column */}
              <div className={styles.kanbanColumn} style={{ opacity: 0.8 }}>
                <div className={styles.kanbanHeader}>
                  <h3 className={styles.kanbanTitle} style={{ color: 'var(--color-success)' }}>Done</h3>
                  <span className={styles.kanbanCount}>{groupedTasks.done.length}</span>
                </div>
                <div className={styles.kanbanList}>
                  {groupedTasks.done.map(task => (
                    <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} onSubtaskToggle={handleSubtaskToggle} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CALENDAR VIEW */}
          {viewMode === 'calendar' && (
            <div className={styles.calendarContainer}>
              <div className={styles.calendarHeader}>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{format(currentDate, 'MMMM yyyy')}</h2>
                <div className={styles.calendarGridHeader}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className={styles.calendarDayName}>{day}</div>
                  ))}
                </div>
              </div>
              <div className={styles.calendarGrid}>
                {calendarDays.map((day, idx) => {
                  const dayTasks = tasks.filter(t => t.deadline && isSameDay(new Date(t.deadline), day));
                  return (
                    <div key={idx} className={`${styles.calendarCell} ${!isSameMonth(day, monthStart) ? styles.calendarCellOutside : ''} ${isToday(day) ? styles.calendarCellToday : ''}`}>
                      <div className={styles.calendarDayNumber}>{format(day, 'd')}</div>
                      <div className={styles.calendarDayTasks}>
                        {dayTasks.map(task => (
                          <div 
                            key={task._id} 
                            className={styles.calendarTaskItem} 
                            style={{ borderLeftColor: getPriorityColor(task.priority) }} 
                            onClick={() => { setEditingTask(task); setIsModalOpen(true); }}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTask} 
        task={editingTask}
      />
    </div>
  );
}
