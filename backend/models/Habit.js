const mongoose = require('mongoose');

const progressLogSchema = new mongoose.Schema({
  date: {
    type: Date, // YYYY-MM-DD string converted to Date
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  }
}, { _id: false });

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
  trackingType: {
    type: String,
    enum: ['boolean', 'numeric', 'timer'],
    default: 'boolean',
  },
  targetValue: {
    type: Number,
    default: 1, // 1 for boolean, customizable for numeric/timer
  },
  unit: {
    type: String,
    default: '', // e.g. 'ml', 'pages', 'mins'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily',
  },
  timeOfDay: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night'],
    default: 'morning',
  },
  logs: [progressLogSchema], // Replaces completedDates
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
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
  }
}, {
  timestamps: true,
});

habitSchema.index({ userId: 1 });

module.exports = mongoose.model('Habit', habitSchema);
