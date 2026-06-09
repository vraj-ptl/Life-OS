const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { expenseValidation, mongoIdValidation } = require('../utils/validators');
const {
  getFinanceData,
  addTransaction,
  deleteTransaction,
  addBudget,
  deleteBudget,
  addSubscription,
  deleteSubscription,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  chatFinanceAI
} = require('../controllers/financeController');

router.use(auth);

router.route('/')
  .get(getFinanceData)
  .post(expenseValidation, addTransaction);

router.delete('/:id', mongoIdValidation, deleteTransaction);

// Budgets
router.post('/budgets', addBudget);
router.delete('/budgets/:id', mongoIdValidation, deleteBudget);

// Subscriptions
router.post('/subscriptions', addSubscription);
router.delete('/subscriptions/:id', mongoIdValidation, deleteSubscription);

// Savings Goals
router.post('/savings-goals', addSavingsGoal);
router.put('/savings-goals/:id', mongoIdValidation, updateSavingsGoal);
router.delete('/savings-goals/:id', mongoIdValidation, deleteSavingsGoal);

// Chatbot
router.post('/chat', chatFinanceAI);

module.exports = router;
