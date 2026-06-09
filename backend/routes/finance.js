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

// Chatbot
router.post('/chat', chatFinanceAI);

module.exports = router;
