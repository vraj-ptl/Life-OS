const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { taskValidation, taskUpdateValidation, mongoIdValidation } = require('../utils/validators');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
} = require('../controllers/taskController');

router.use(auth); // All task routes require authentication

router.route('/')
  .get(getTasks)
  .post(taskValidation, createTask);

router.get('/stats', getTaskStats);

router.route('/:id')
  .put(mongoIdValidation, taskUpdateValidation, updateTask)
  .delete(mongoIdValidation, deleteTask);

module.exports = router;
