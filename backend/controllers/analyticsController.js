const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Transaction = require('../models/Transaction');
const aiEngine = require('../services/aiEngine');

/**
 * @desc    Get dashboard analytics and AI insights
 * @route   GET /api/analytics/dashboard
 */
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Gather Telemetry
    // Tasks
    const pendingTasks = await Task.countDocuments({ userId, status: { $in: ['todo', 'in-progress'] } });
    const completedTasksLastWeek = await Task.countDocuments({ userId, status: 'done', completedAt: { $gte: oneWeekAgo } });
    
    // Habits
    const habits = await Habit.find({ userId });
    const activeHabits = habits.length;
    const habitStreakAvg = habits.length > 0 ? (habits.reduce((acc, h) => acc + h.currentStreak, 0) / habits.length) : 0;
    
    // Finance
    const monthlyTransactions = await Transaction.find({ userId, date: { $gte: startOfMonth } });
    const totalIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    // Context object for AI
    const userContext = {
      stats: {
        pendingTasks,
        completedTasksLastWeek,
        activeHabits,
        habitStreakAvg,
        totalIncome,
        totalExpenses
      }
    };

    // 2. Generate AI Insight
    const aiInsight = await aiEngine.generateDailyInsights(userId, userContext);

    // 3. Format Response Data
    const data = {
      overview: {
        tasks: { pending: pendingTasks, completed7d: completedTasksLastWeek },
        habits: { active: activeHabits, averageStreak: habitStreakAvg },
        finance: { income: totalIncome, expenses: totalExpenses, balance: totalIncome - totalExpenses }
      },
      aiInsight,
    };

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('GetDashboardData error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
