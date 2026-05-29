const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default
  },
  avatar: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },

  // Goals for AI alignment
  goals: [{
    title: { type: String, required: true },
    description: { type: String, default: '' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    createdAt: { type: Date, default: Date.now },
  }],

  // Preferences
  preferences: {
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    currency: { type: String, default: 'INR' },
    notificationsEnabled: { type: Boolean, default: true },
    productiveHoursStart: { type: Number, default: 9 }, // 9 AM
    productiveHoursEnd: { type: Number, default: 23 },   // 11 PM
  },

  // Gamification
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{
    id: String,
    name: String,
    description: String,
    icon: String,
    earnedAt: { type: Date, default: Date.now },
  }],

  // OTP for password reset
  resetOtp: { type: String, select: false },
  resetOtpExpiry: { type: Date, select: false },
  resetToken: { type: String, select: false },
  resetTokenExpiry: { type: Date, select: false },

  // Connected services
  gmailConnected: { type: Boolean, default: false },
  gmailTokens: { type: Object, select: false },
  calendarConnected: { type: Boolean, default: false },
  calendarTokens: { type: Object, select: false },

}, {
  timestamps: true,
});

// Index for fast lookups
userSchema.index({ email: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate level from XP
userSchema.methods.calculateLevel = function() {
  this.level = Math.floor(this.xp / 100) + 1;
  return this.level;
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetOtp;
  delete obj.resetOtpExpiry;
  delete obj.resetToken;
  delete obj.resetTokenExpiry;
  delete obj.gmailTokens;
  delete obj.calendarTokens;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
