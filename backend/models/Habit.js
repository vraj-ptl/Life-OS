const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Habit name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  icon: {
    type: String,
    default: '✨',
  },
  color: {
    type: String,
    default: '#8b5cf6', // Primary color
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily',
  },
  completedDates: [{
    type: Date, // We'll store dates as YYYY-MM-DD strings converted to start-of-day Date objects
  }],
  currentStreak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    enum: ['health', 'productivity', 'learning', 'mindfulness', 'other'],
    default: 'other',
  },
  reminderTime: {
    type: String, // e.g. "09:00"
  },
}, {
  timestamps: true,
});

habitSchema.index({ userId: 1 });

module.exports = mongoose.model('Habit', habitSchema);
