const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Subscription = require('../models/Subscription');
const SavingsGoal = require('../models/SavingsGoal');
const aiEngine = require('../services/aiEngine');

/**
 * @desc    Get all finance data
 * @route   GET /api/finance
 */
exports.getFinanceData = async (req, res) => {
  try {
    const { month, year } = req.query;
    
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
    const savingsGoals = await SavingsGoal.find({ userId: req.userId });

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
        subscriptions,
        savingsGoals
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
    const subscription = await Subscription.create({ ...req.body, userId: req.userId });
    res.status(201).json({ success: true, data: { subscription } });
  } catch (error) {
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

// --- SAVINGS GOALS ---
exports.addSavingsGoal = async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.create({ ...req.body, userId: req.userId });
    res.status(201).json({ success: true, data: { savingsGoal } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateSavingsGoal = async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: { savingsGoal } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteSavingsGoal = async (req, res) => {
  try {
    await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- AI CHATBOT ---
exports.chatFinanceAI = async (req, res) => {
  try {
    const { messages, context } = req.body;
    await aiEngine.chatWithFinanceAI(messages, context, res);
  } catch (error) {
    console.error('Chat AI Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to chat' });
    }
  }
};
