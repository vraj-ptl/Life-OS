const { body, param, query } = require('express-validator');

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
];

const verifyOtpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
];

const resetPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('resetToken')
    .trim()
    .notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

// Task validations
const taskValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done', 'overdue']).withMessage('Invalid status'),
  body('deadline')
    .optional()
    .isISO8601().withMessage('Invalid deadline date'),
  body('estimatedDuration')
    .optional()
    .isNumeric().withMessage('Duration must be a number (minutes)'),
  body('energyRequired')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Invalid energy level'),
];

// Habit validations
const habitValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Habit name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'custom']).withMessage('Invalid frequency'),
];

// Expense validations
const expenseValidation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  body('category')
    .optional()
    .isIn(['food', 'transport', 'entertainment', 'shopping', 'bills', 'subscriptions', 'health', 'education', 'other'])
    .withMessage('Invalid category'),
  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date'),
];

// Budget validations
const budgetValidation = [
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  body('limit')
    .notEmpty().withMessage('Budget limit is required')
    .isFloat({ min: 1 }).withMessage('Budget limit must be greater than 0'),
  body('period')
    .optional()
    .isIn(['weekly', 'monthly']).withMessage('Period must be weekly or monthly'),
];

// MongoDB ID validation
const mongoIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  taskValidation,
  habitValidation,
  expenseValidation,
  budgetValidation,
  mongoIdValidation,
};
