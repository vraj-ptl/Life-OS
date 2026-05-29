'use client';

import { useState, useEffect } from 'react';
import { TaskCard } from '@/components/features/TaskCard';
import { TaskModal } from '@/components/features/TaskModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Plus, List, Layout, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import api from '@/lib/api';

type ViewMode = 'list' | 'kanban' | 'calendar';

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  
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

  // Group tasks by status for List View
  const groupedTasks = {
    todo: tasks.filter(t => t.status === 'todo'),
    inProgress: tasks.filter(t => t.status === 'in-progress'),
    overdue: tasks.filter(t => t.status === 'overdue'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-1">Tasks</h1>
          <p className="text-secondary text-sm">Manage your work with AI scheduling</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="flex bg-card border border-border-default rounded-md p-1">
            <button 
              className={`p-1.5 rounded text-muted hover:text-primary transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
            <button 
              className={`p-1.5 rounded text-muted hover:text-primary transition-colors ${viewMode === 'kanban' ? 'bg-primary/10 text-primary' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban View"
            >
              <Layout size={18} />
            </button>
            <button 
              className={`p-1.5 rounded text-muted hover:text-primary transition-colors ${viewMode === 'calendar' ? 'bg-primary/10 text-primary' : ''}`}
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
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border-dashed rounded-xl border-dashed">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <CheckSquare size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
          <p className="text-secondary max-w-sm mb-6">
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
            <div className="flex flex-col gap-lg">
              {groupedTasks.overdue.length > 0 && (
                <section>
                  <h3 className="text-danger font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-danger"></span> Overdue
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {groupedTasks.overdue.map(task => (
                      <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                </section>
              )}

              {groupedTasks.todo.length > 0 && (
                <section>
                  <h3 className="text-primary-light font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-light"></span> To Do
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {groupedTasks.todo.map(task => (
                      <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                </section>
              )}

              {groupedTasks.done.length > 0 && (
                <section>
                  <h3 className="text-success font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success"></span> Completed
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {groupedTasks.done.map(task => (
                      <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* KANBAN VIEW (Simplified for now, true D&D can be added) */}
          {viewMode === 'kanban' && (
            <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
              {/* To Do Column */}
              <div className="flex-1 min-w-[300px] bg-bg-secondary rounded-xl p-4 flex flex-col border border-border-subtle">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-primary-light">To Do</h3>
                  <span className="bg-card text-xs py-1 px-2 rounded-md">{groupedTasks.todo.length}</span>
                </div>
                <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                  {groupedTasks.todo.map(task => (
                    <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="flex-1 min-w-[300px] bg-bg-secondary rounded-xl p-4 flex flex-col border border-border-subtle">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-info">In Progress</h3>
                  <span className="bg-card text-xs py-1 px-2 rounded-md">{groupedTasks.inProgress.length}</span>
                </div>
                <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                  {groupedTasks.inProgress.map(task => (
                    <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              </div>

              {/* Done Column */}
              <div className="flex-1 min-w-[300px] bg-bg-secondary rounded-xl p-4 flex flex-col border border-border-subtle opacity-80">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-success">Done</h3>
                  <span className="bg-card text-xs py-1 px-2 rounded-md">{groupedTasks.done.length}</span>
                </div>
                <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                  {groupedTasks.done.map(task => (
                    <TaskCard key={task._id} task={task} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CALENDAR VIEW */}
          {viewMode === 'calendar' && (
            <div className="bg-card border border-border-default rounded-xl p-8 text-center">
              <CalendarIcon size={48} className="mx-auto text-muted mb-4" />
              <h3 className="text-xl font-semibold mb-2">Calendar View</h3>
              <p className="text-secondary">A full calendar view is planned for Phase 4 integration.</p>
              <Button variant="outline" className="mt-4" onClick={() => setViewMode('list')}>Back to List</Button>
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

// Ensure lucide icon imports work by declaring a dummy component here if needed, but it's handled at top.
import { CheckSquare } from 'lucide-react';
