const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

/**
 * @desc    Get all tasks for user
 * @route   GET /api/tasks
 */
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, search, sort = 'deadline', order = 'asc' } = req.query;
    
    // Build query
    const query = { userId: req.userId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$text = { $search: search }; // Requires text index or simple regex
      // Simple regex fallback
      query.title = { $regex: search, $options: 'i' };
    }

    // Sort options
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const tasks = await Task.find(query).sort(sortObj);

    res.json({
      success: true,
      count: tasks.length,
      data: { tasks },
    });
  } catch (error) {
    console.error('GetTasks error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 */
exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const taskData = { ...req.body, userId: req.userId };
    
    // AI Suggestion simulation (to be replaced with actual AI Engine in Phase 3)
    if (!taskData.deadline) {
      // If no deadline, suggest tomorrow at 10 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setMinutes(endTime.getMinutes() + 30);

      taskData.suggestedTime = {
        startTime: tomorrow,
        endTime: endTime,
        reason: 'Based on your typical productivity hours for high-energy tasks.',
        confidence: 0.85,
      };
    }

    const task = await Task.create(taskData);

    // Log activity (fire and forget)
    // ActivityLog.create({ userId: req.userId, action: 'task_created', metadata: { taskId: task._id } }).catch(console.error);

    res.status(201).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('CreateTask error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 */
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const prevStatus = task.status;
    const newStatus = req.body.status;

    // Check if status is changing to 'done'
    const isCompleting = newStatus === 'done' && prevStatus !== 'done';
    if (isCompleting) {
      req.body.completedAt = new Date();
    }

    // Check if status is being REVERTED from 'done' to something else
    const isReverting = prevStatus === 'done' && newStatus && newStatus !== 'done';

    // Check if task is becoming overdue
    const isBecomingOverdue = newStatus === 'overdue' && prevStatus !== 'overdue';

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Helper to add interval to a date based on frequency
    const addInterval = (date, freq) => {
      const d = new Date(date);
      if (freq === 'daily') d.setDate(d.getDate() + 1);
      else if (freq === 'weekly') d.setDate(d.getDate() + 7);
      else if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
      return d;
    };

    // --- Clone recurring task on completion ---
    if (isCompleting && task.recurring && task.recurring.isRecurring) {
      try {
        const freq = task.recurring.frequency;
        const cloneData = {
          userId: task.userId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: 'todo',
          energyRequired: task.energyRequired,
          tags: task.tags || [],
          subtasks: (task.subtasks || []).map(st => ({ title: st.title, isCompleted: false })),
          recurring: { isRecurring: true, frequency: freq },
          parentTaskId: task._id,
        };

        if (task.startTime) cloneData.startTime = addInterval(task.startTime, freq);
        if (task.deadline) cloneData.deadline = addInterval(task.deadline, freq);

        await Task.create(cloneData);
      } catch (recurErr) {
        console.error('Recurring task clone error:', recurErr);
      }
    }

    // --- Delete child clone when reverting from done ---
    if (isReverting && task.recurring && task.recurring.isRecurring) {
      try {
        await Task.deleteMany({ parentTaskId: task._id, userId: task.userId });
      } catch (delErr) {
        console.error('Failed to delete recurring clone on revert:', delErr);
      }
    }

    // --- Clone recurring task on overdue ---
    if (isBecomingOverdue && task.recurring && task.recurring.isRecurring) {
      try {
        const freq = task.recurring.frequency;
        // Check if a clone already exists for this parent
        const existingClone = await Task.findOne({ parentTaskId: task._id, userId: task.userId });
        if (!existingClone) {
          const cloneData = {
            userId: task.userId,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: 'todo',
            energyRequired: task.energyRequired,
            tags: task.tags || [],
            subtasks: (task.subtasks || []).map(st => ({ title: st.title, isCompleted: false })),
            recurring: { isRecurring: true, frequency: freq },
            parentTaskId: task._id,
          };

          if (task.startTime) cloneData.startTime = addInterval(task.startTime, freq);
          if (task.deadline) cloneData.deadline = addInterval(task.deadline, freq);

          await Task.create(cloneData);
        }
      } catch (recurErr) {
        console.error('Recurring task clone on overdue error:', recurErr);
      }
    }

    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('UpdateTask error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('DeleteTask error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Get task stats
 * @route   GET /api/tasks/stats
 */
exports.getTaskStats = async (req, res) => {
  try {
    const total = await Task.countDocuments({ userId: req.userId });
    const completed = await Task.countDocuments({ userId: req.userId, status: 'done' });
    const overdue = await Task.countDocuments({ userId: req.userId, status: 'overdue' });
    const urgent = await Task.countDocuments({ userId: req.userId, priority: 'urgent', status: { $ne: 'done' } });

    res.json({
      success: true,
      data: {
        total,
        completed,
        overdue,
        urgent,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('GetTaskStats error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
