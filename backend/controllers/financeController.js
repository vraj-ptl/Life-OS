const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Subscription = require('../models/Subscription');
const aiEngine = require('../services/aiEngine');

/**
 * Process due subscriptions — auto-creates expense transactions
 * for any subscription whose nextBillingDate <= today.
 */
const processSubscriptions = async (userId) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // end of today

  const dueSubscriptions = await Subscription.find({
    userId,
    isActive: true,
    nextBillingDate: { $lte: today }
  });

  for (const sub of dueSubscriptions) {
    // Create an expense transaction for this subscription payment
    await Transaction.create({
      userId,
      type: 'expense',
      amount: sub.amount,
      category: sub.category || 'Entertainment',
      description: `Subscription: ${sub.name}`,
      date: sub.nextBillingDate
    });

    // Advance nextBillingDate to next cycle
    const nextDate = new Date(sub.nextBillingDate);
    if (sub.billingCycle === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    sub.nextBillingDate = nextDate;
    await sub.save();
  }

  return dueSubscriptions.length;
};

/**
 * @desc    Get all finance data
 * @route   GET /api/finance
 */
exports.getFinanceData = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Process any due subscriptions first (auto-deduction engine)
    await processSubscriptions(req.userId);

    // Build query for date range if provided
    const query = { userId: req.userId };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    const budgets = await Budget.find({ userId: req.userId });
    const subscriptions = await Subscription.find({ userId: req.userId });

    // Calculate Summary
    const summary = transactions.reduce((acc, curr) => {
      if (curr.type === 'income') {
        acc.income += curr.amount;
      } else {
        acc.expense += curr.amount;
      }
      return acc;
    }, { income: 0, expense: 0, balance: 0 });

    summary.balance = summary.income - summary.expense;

    // Calculate category breakdown for expenses
    const expensesByCategory = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      }
    });

    res.json({
      success: true,
      data: { 
        summary,
        expensesByCategory,
        transactions,
        budgets,
        subscriptions
      },
    });
  } catch (error) {
    console.error('GetFinanceData error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- TRANSACTIONS ---
exports.addTransaction = async (req, res) => {
  try {
    const transactionData = { ...req.body, userId: req.userId };
    const transaction = await Transaction.create(transactionData);
    res.status(201).json({ success: true, data: { transaction } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- BUDGETS ---
exports.addBudget = async (req, res) => {
  try {
    const budget = await Budget.create({ ...req.body, userId: req.userId });
    res.status(201).json({ success: true, data: { budget } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- SUBSCRIPTIONS ---
exports.addSubscription = async (req, res) => {
  try {
    // Validate: nextBillingDate must be today or future
    const billingDate = new Date(req.body.nextBillingDate);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    if (billingDate < todayStart) {
      return res.status(400).json({ success: false, message: 'Billing date cannot be in the past.' });
    }

    const subscription = await Subscription.create({ ...req.body, userId: req.userId });

    // If billing date is today, immediately create the expense transaction
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (billingDate <= today) {
      await Transaction.create({
        userId: req.userId,
        type: 'expense',
        amount: subscription.amount,
        category: subscription.category || 'Entertainment',
        description: `Subscription: ${subscription.name}`,
        date: billingDate
      });

      // Advance to next billing cycle
      const nextDate = new Date(billingDate);
      if (subscription.billingCycle === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      subscription.nextBillingDate = nextDate;
      await subscription.save();
    }

    res.status(201).json({ success: true, data: { subscription } });
  } catch (error) {
    console.error('AddSubscription error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    await Subscription.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

