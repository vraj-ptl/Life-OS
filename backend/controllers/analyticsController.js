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

/**
 * @desc    Get detailed analytics for interactive charts
 * @route   GET /api/analytics/detailed
 */
exports.getDetailedAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    
    const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month) : now.getMonth() + 1;
    
    const startDate = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    const isCurrentMonth = (year === now.getFullYear() && month === now.getMonth() + 1);
    const endDate = isCurrentMonth ? now : lastDayOfMonth;
    
    const numDaysToProcess = isCurrentMonth ? now.getDate() : lastDayOfMonth.getDate();

    // 1. Fetch Tasks, Habits, Transactions
    const tasks = await Task.find({ 
      userId, 
      $or: [
        { completedAt: { $gte: startDate, $lte: endDate }, status: 'done' },
        { deadline: { $gte: startDate, $lte: endDate }, status: 'overdue' },
        { status: { $in: ['todo', 'in-progress'] } }
      ]
    });
    const habits = await Habit.find({ userId });
    const transactions = await Transaction.find({ userId, date: { $gte: startDate, $lte: endDate } });

    // Aggregation variables
    const timelineData = [];
    let totalCompletedTasks = 0;
    let totalMissedTasks = 0;
    let totalHighEnergy = 0;
    let totalLowEnergy = 0;
    let totalHabitsCompleted = 0;
    let expectedHabitsLogs = 0;
    
    habits.forEach(h => {
      const createdDateOnly = new Date(h.createdAt || h._id.getTimestamp());
      createdDateOnly.setHours(0,0,0,0);
      for (let i = 1; i <= numDaysToProcess; i++) {
        const d = new Date(year, month - 1, i);
        if (d >= createdDateOnly) {
          expectedHabitsLogs++;
        }
      }
    });
    
    const tagDistribution = {};
    const timeOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const dayOfWeekProductivity = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 }; // Sun-Sat

    // 2. Aggregate data by day
    for (let i = 1; i <= numDaysToProcess; i++) {
      // Use midday to avoid local timezone shifting the date string
      const d = new Date(year, month - 1, i, 12, 0, 0);
      const dateString = d.toISOString().split('T')[0];
      
      // Tasks for this day
      const dayDoneTasks = tasks.filter(t => t.status === 'done' && t.completedAt && t.completedAt.toISOString().split('T')[0] === dateString);
      const dayMissedTasks = tasks.filter(t => t.status === 'overdue' && t.deadline && t.deadline.toISOString().split('T')[0] === dateString);
      
      const tasksCompleted = dayDoneTasks.length;
      const missedTasks = dayMissedTasks.length;
      
      const lowEnergyTasks = dayDoneTasks.filter(t => t.energyRequired === 'low').length;
      const medEnergyTasks = dayDoneTasks.filter(t => t.energyRequired === 'medium').length;
      const highEnergyTasks = dayDoneTasks.filter(t => t.energyRequired === 'high').length;

      totalCompletedTasks += tasksCompleted;
      totalMissedTasks += missedTasks;
      totalHighEnergy += highEnergyTasks;
      totalLowEnergy += lowEnergyTasks;

      // Populate time of day
      dayDoneTasks.forEach(t => {
        // Time of day
        const hour = new Date(t.completedAt).getHours();
        if (hour >= 5 && hour < 12) timeOfDay.morning++;
        else if (hour >= 12 && hour < 17) timeOfDay.afternoon++;
        else if (hour >= 17 && hour < 21) timeOfDay.evening++;
        else timeOfDay.night++;
        
        // Day of week
        dayOfWeekProductivity[new Date(t.completedAt).getDay()]++;
      });
      
      // Habits for this day
      let habitsCompleted = 0;
      let habitsExpectedToday = 0;
      habits.forEach(h => {
        const createdDateOnly = new Date(h.createdAt || h._id.getTimestamp());
        createdDateOnly.setHours(0,0,0,0);
        const currentDayStart = new Date(year, month - 1, i);
        if (currentDayStart >= createdDateOnly) {
          habitsExpectedToday++;
          const log = h.logs.find(l => l.date && l.date.toISOString().split('T')[0] === dateString);
          if (log && log.isCompleted) habitsCompleted++;
        }
      });
      totalHabitsCompleted += habitsCompleted;
      
      // Finance for this day
      const dayTransactions = transactions.filter(t => t.date && t.date.toISOString().split('T')[0] === dateString);
      const expenses = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const income = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);

      timelineData.push({
        date: dateString,
        tasksCompleted,
        missedTasks,
        lowEnergyTasks,
        medEnergyTasks,
        highEnergyTasks,
        habitsCompleted,
        habitsExpected: habitsExpectedToday,
        expenses,
        income
      });
    }

    // Calculate global tag distribution for all fetched active/completed tasks
    tasks.forEach(t => {
      if (t.tags && t.tags.length > 0) {
        t.tags.forEach(tag => {
          tagDistribution[tag] = (tagDistribution[tag] || 0) + 1;
        });
      } else {
        tagDistribution['Uncategorized'] = (tagDistribution['Uncategorized'] || 0) + 1;
      }
    });

    // Process tags into array format for Recharts Pie
    const tagsArray = Object.keys(tagDistribution).map(name => ({
      name,
      value: tagDistribution[name]
    })).sort((a, b) => b.value - a.value);

    // Process time of day into array format
    const timeOfDayArray = [
      { name: 'Morning', value: timeOfDay.morning },
      { name: 'Afternoon', value: timeOfDay.afternoon },
      { name: 'Evening', value: timeOfDay.evening },
      { name: 'Night', value: timeOfDay.night }
    ];

    // Find most productive day
    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let mostProductiveDayIdx = 0;
    for (let i = 1; i < 7; i++) {
      if (dayOfWeekProductivity[i] > dayOfWeekProductivity[mostProductiveDayIdx]) {
        mostProductiveDayIdx = i;
      }
    }
    const mostProductiveDay = daysMap[mostProductiveDayIdx];

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    const numericalSummaries = {
      netFlow: totalIncome - totalExpenses,
      habitConsistencyRate: expectedHabitsLogs > 0 ? ((totalHabitsCompleted / expectedHabitsLogs) * 100).toFixed(1) : 0,
      completionRate: (totalCompletedTasks + totalMissedTasks) > 0 ? ((totalCompletedTasks / (totalCompletedTasks + totalMissedTasks)) * 100).toFixed(1) : 0,
      mostProductiveDay,
      totalCompletedTasks,
      totalMissedTasks,
      totalIncome,
      totalExpenses
    };

    // 3. Generate AI Insight for detailed view
    let aiInsight = "Keep up the great work! Analyze your charts to find your optimal workflow.";
    try {
      const insightContext = {
        stats: {
          completionRate: numericalSummaries.completionRate,
          habitConsistencyRate: numericalSummaries.habitConsistencyRate,
          highEnergyRatio: totalCompletedTasks > 0 ? (totalHighEnergy / totalCompletedTasks) : 0,
          netFlow: numericalSummaries.netFlow,
          mostProductiveDay: numericalSummaries.mostProductiveDay,
          topTags: tagsArray.slice(0, 3).map(t => t.name).join(', '),
          productivityTimeOfDay: timeOfDayArray.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'
        }
      };
      // We use the existing aiEngine to generate an insight
      aiInsight = await aiEngine.generateDailyInsights(userId, insightContext);
    } catch (e) {
      console.error('Failed to generate AI insight', e);
    }

    res.json({
      success: true,
      data: {
        timelineData,
        taskDistribution: tagsArray,
        timeOfDay: timeOfDayArray,
        numericalSummaries,
        aiInsight
      }
    });

  } catch (error) {
    console.error('GetDetailedAnalytics error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
