const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done', 'overdue'],
    default: 'todo',
  },
  deadline: {
    type: Date,
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 30,
  },
  energyRequired: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  subtasks: [{
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
  }],
  recurring: {
    isRecurring: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'] },
    customDays: [Number], // 0-6 for Sunday-Saturday
  },
  suggestedTime: {
    startTime: Date,
    endTime: Date,
    reason: String,
    confidence: Number,
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for faster querying
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, deadline: 1 });

module.exports = mongoose.model('Task', taskSchema);
