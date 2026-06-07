const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { habitValidation, mongoIdValidation } = require('../utils/validators');
const {
  getHabits,
  createHabit,
  updateHabit,
  toggleHabit,
  deleteHabit,
} = require('../controllers/habitController');

router.use(auth);

router.route('/')
  .get(getHabits)
  .post(habitValidation, createHabit);

router.route('/:id')
  .put(mongoIdValidation, updateHabit)
  .delete(mongoIdValidation, deleteHabit);

router.put('/:id/toggle', mongoIdValidation, toggleHabit);

module.exports = router;
