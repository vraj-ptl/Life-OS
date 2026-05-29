const { validationResult } = require('express-validator');
const Habit = require('../models/Habit');

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
    const habits = await Habit.find({ userId: req.userId }).sort({ createdAt: -1 });

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
 * @desc    Toggle habit completion for a specific date
 * @route   PUT /api/habits/:id/toggle
 */
exports.toggleHabit = async (req, res) => {
  try {
    const { date } = req.body; // Expects YYYY-MM-DD or defaults to today
    const targetDate = getNormalizedDate(date);
    const targetTime = targetDate.getTime();

    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    // Check if date already exists
    const dateExists = habit.completedDates.some(d => d.getTime() === targetTime);
    let isCompleted = false;

    if (dateExists) {
      // Remove it (untoggle)
      habit.completedDates = habit.completedDates.filter(d => d.getTime() !== targetTime);
    } else {
      // Add it (toggle on)
      habit.completedDates.push(targetDate);
      isCompleted = true;
    }

    // Recalculate streak
    // Sort dates descending
    const sortedDates = [...habit.completedDates].sort((a, b) => b.getTime() - a.getTime());
    
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
      message: isCompleted ? 'Habit marked as completed' : 'Habit unmarked',
      data: { habit, isCompleted },
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
