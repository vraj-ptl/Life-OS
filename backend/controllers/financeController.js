const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');

/**
 * @desc    Get all transactions & summary
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
        transactions
      },
    });
  } catch (error) {
    console.error('GetFinanceData error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Add new transaction
 * @route   POST /api/finance
 */
exports.addTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const transactionData = { ...req.body, userId: req.userId };
    const transaction = await Transaction.create(transactionData);

    res.status(201).json({
      success: true,
      data: { transaction },
    });
  } catch (error) {
    console.error('AddTransaction error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Delete transaction
 * @route   DELETE /api/finance/:id
 */
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('DeleteTransaction error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
