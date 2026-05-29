const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { habitValidation, mongoIdValidation } = require('../utils/validators');
const {
  getHabits,
  createHabit,
  toggleHabit,
  deleteHabit,
} = require('../controllers/habitController');

router.use(auth);

router.route('/')
  .get(getHabits)
  .post(habitValidation, createHabit);

router.put('/:id/toggle', mongoIdValidation, toggleHabit);
router.delete('/:id', mongoIdValidation, deleteHabit);

module.exports = router;
