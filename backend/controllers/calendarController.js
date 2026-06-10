const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');

/**
 * @desc    Get aggregated calendar data for a specific month
 * @route   GET /api/calendar
 */
exports.getCalendarData = async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    
    const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month) : now.getMonth() + 1;
    
    const startDate = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch Tasks
    const tasks = await Task.find({ 
      userId,
      $or: [
        { deadline: { $gte: startDate, $lte: lastDayOfMonth } },
        { startTime: { $gte: startDate, $lte: lastDayOfMonth } },
        { status: 'done', completedAt: { $gte: startDate, $lte: lastDayOfMonth } }
      ]
    });

    // Fetch Habits
    const habits = await Habit.find({ userId });

    // Fetch Subscriptions (to project them onto the calendar)
    const subscriptions = await Subscription.find({ userId, status: 'active' });

    // Format data into a daily map
    const calendarMap = {};
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      calendarMap[dateString] = {
        tasks: [],
        habits: [],
        subscriptions: []
      };
    }

    // Populate Tasks
    tasks.forEach(task => {
      let targetDate = null;
      if (task.completedAt) {
        targetDate = task.completedAt.toISOString().split('T')[0];
      } else if (task.startTime) {
        targetDate = task.startTime.toISOString().split('T')[0];
      } else if (task.deadline) {
        targetDate = task.deadline.toISOString().split('T')[0];
      }

      if (targetDate && calendarMap[targetDate]) {
        calendarMap[targetDate].tasks.push({
          _id: task._id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          energyRequired: task.energyRequired
        });
      }
    });

    // Populate Habits
    habits.forEach(habit => {
      habit.logs.forEach(log => {
        const logDateStr = new Date(log.date).toISOString().split('T')[0];
        if (calendarMap[logDateStr] && log.isCompleted) {
          calendarMap[logDateStr].habits.push({
            _id: habit._id,
            name: habit.name,
            color: habit.color
          });
        }
      });
    });

    // Populate Subscriptions
    subscriptions.forEach(sub => {
      if (sub.nextBillingDate) {
        let billingDate = new Date(sub.nextBillingDate);
        
        // If billing cycle is monthly, we project it for the requested month
        if (sub.billingCycle === 'monthly') {
          // Simplistic projection: set the date to the current requested month
          billingDate = new Date(year, month - 1, billingDate.getDate());
        }
        
        const subDateStr = billingDate.toISOString().split('T')[0];
        if (calendarMap[subDateStr]) {
          calendarMap[subDateStr].subscriptions.push({
            _id: sub._id,
            name: sub.name,
            amount: sub.amount,
            category: sub.category
          });
        }
      }
    });

    res.json({
      success: true,
      data: {
        calendarMap
      }
    });

  } catch (error) {
    console.error('GetCalendarData error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


