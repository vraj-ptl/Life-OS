const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { transactionValidation, mongoIdValidation } = require('../utils/validators');
const {
  getFinanceData,
  addTransaction,
  deleteTransaction,
} = require('../controllers/financeController');

router.use(auth);

router.route('/')
  .get(getFinanceData)
  .post(transactionValidation, addTransaction);

router.delete('/:id', mongoIdValidation, deleteTransaction);

module.exports = router;
