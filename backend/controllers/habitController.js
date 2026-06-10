const { validationResult } = require('express-validator');
const Habit = require('../models/Habit');
const User = require('../models/User');

// Helper to get normalized date (YYYY-MM-DD at 00:00:00Z)
const getNormalizedDate = (dateString) => {
  const d = dateString ? new Date(dateString) : new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

/**
 * @desc    Get all habits
 * @route   GET /api/habits
 */
exports.getHabits = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.userId };
    if (status) {
      query.status = status;
    } else {
      query.status = 'active'; // Default to active
    }

    const habits = await Habit.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { habits },
    });
  } catch (error) {
    console.error('GetHabits error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Create new habit
 * @route   POST /api/habits
 */
exports.createHabit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const habitData = { ...req.body, userId: req.userId };
    const habit = await Habit.create(habitData);

    res.status(201).json({
      success: true,
      data: { habit },
    });
  } catch (error) {
    console.error('CreateHabit error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Update habit (including archive)
 * @route   PUT /api/habits/:id
 */
exports.updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    res.json({ success: true, data: { habit } });
  } catch (error) {
    console.error('UpdateHabit error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Toggle or update habit progress for a specific date
 * @route   PUT /api/habits/:id/toggle
 */
exports.toggleHabit = async (req, res) => {
  try {
    const { date, progress } = req.body; // Expects YYYY-MM-DD
    const targetDate = getNormalizedDate(date);
    const targetTime = targetDate.getTime();

    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    // Find if log exists for date
    const logIndex = habit.logs.findIndex(log => new Date(log.date).getTime() === targetTime);
    let currentLog = logIndex >= 0 ? habit.logs[logIndex] : null;
    const wasCompleted = currentLog ? currentLog.isCompleted : false;

    if (habit.trackingType === 'boolean') {
      if (currentLog && currentLog.isCompleted) {
        // Toggle off
        habit.logs.splice(logIndex, 1);
        currentLog = null;
      } else {
        // Toggle on
        if (logIndex >= 0) {
          habit.logs[logIndex].isCompleted = true;
          habit.logs[logIndex].progress = habit.targetValue;
          habit.logs[logIndex].completedAt = new Date();
        } else {
          habit.logs.push({ date: targetDate, progress: habit.targetValue, isCompleted: true, completedAt: new Date() });
        }
      }
    } else {
      // Numeric or Timer
      const newProgress = progress !== undefined ? progress : 0;
      const isCompleted = newProgress >= habit.targetValue;

      if (logIndex >= 0) {
        if (newProgress <= 0) {
          habit.logs.splice(logIndex, 1);
          currentLog = null;
        } else {
          if (!habit.logs[logIndex].isCompleted && isCompleted) {
            habit.logs[logIndex].completedAt = new Date();
          } else if (!isCompleted) {
            habit.logs[logIndex].completedAt = undefined;
          }
          habit.logs[logIndex].progress = newProgress;
          habit.logs[logIndex].isCompleted = isCompleted;
          currentLog = habit.logs[logIndex];
        }
      } else if (newProgress > 0) {
        currentLog = { date: targetDate, progress: newProgress, isCompleted, completedAt: isCompleted ? new Date() : undefined };
        habit.logs.push(currentLog);
      }
    }

    // Award or Revert XP if completion status changed
    try {
      const isCompletedNow = currentLog ? currentLog.isCompleted : false;
      if (wasCompleted !== isCompletedNow) {
        const user = await User.findById(req.userId);
        if (user) {
          if (isCompletedNow) {
            user.xp += 5; // 5 XP for habit
          } else {
            user.xp = Math.max(0, user.xp - 5);
          }
          user.level = Math.floor(user.xp / 100) + 1;
          await user.save();
        }
      }
    } catch (err) {
      console.error('Error updating XP for habit:', err);
    }

    // Recalculate streak based on completed logs
    const completedLogs = habit.logs.filter(log => log.isCompleted);
    const sortedDates = completedLogs.map(log => new Date(log.date)).sort((a, b) => b.getTime() - a.getTime());
    
    let currentStreak = 0;
    const today = getNormalizedDate();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (sortedDates.length > 0) {
      // Streak starts if latest is today or yesterday
      if (sortedDates[0].getTime() === today.getTime() || sortedDates[0].getTime() === yesterday.getTime()) {
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const diffDays = Math.round((sortedDates[i-1].getTime() - sortedDates[i].getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    habit.currentStreak = currentStreak;
    if (currentStreak > habit.longestStreak) {
      habit.longestStreak = currentStreak;
    }

    await habit.save();

    res.json({
      success: true,
      message: 'Habit progress updated',
      data: { habit, isCompleted: currentLog ? currentLog.isCompleted : false },
    });
  } catch (error) {
    console.error('ToggleHabit error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Delete habit
 * @route   DELETE /api/habits/:id
 */
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    res.json({
      success: true,
      message: 'Habit deleted successfully',
    });
  } catch (error) {
    console.error('DeleteHabit error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
