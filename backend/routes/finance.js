const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { expenseValidation, mongoIdValidation } = require('../utils/validators');
const {
  getFinanceData,
  addTransaction,
  deleteTransaction,
} = require('../controllers/financeController');

router.use(auth);

router.route('/')
  .get(getFinanceData)
  .post(expenseValidation, addTransaction);

router.delete('/:id', mongoIdValidation, deleteTransaction);

module.exports = router;
