const mongoose = require('mongoose');
const Task = require('./models/Task');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/life-os').then(async () => {
  try {
    const user = await User.findOne();
    if (!user) {
      console.log('No user found');
      process.exit();
    }

    const now = new Date();
    const startTime = new Date(now.getTime() + 15 * 1000); // starts in 15s
    const deadline = new Date(startTime.getTime() + 2 * 60 * 1000); // ends 2 mins after start

    const task = await Task.create({
      userId: user._id,
      title: 'Auto-Start Demo Task',
      description: 'This task will automatically switch to In Progress in 15 seconds, and become Overdue in 2 minutes!',
      priority: 'high',
      status: 'todo',
      startTime: startTime,
      deadline: deadline,
      energyRequired: 'medium',
      tags: ['Demo', 'Real-time']
    });
    console.log('Created example task', task._id);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
});
