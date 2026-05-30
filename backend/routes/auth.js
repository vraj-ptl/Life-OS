const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
} = require('../utils/validators');
const {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require('../controllers/authController');
const {
  getGoogleAuthUrl,
  googleAuthCallback,
} = require('../controllers/googleAuthController');

// Public routes (with rate limiting)
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/forgot-password', otpLimiter, forgotPasswordValidation, forgotPassword);
router.post('/verify-otp', otpLimiter, verifyOtpValidation, verifyOtp);
router.post('/reset-password', otpLimiter, resetPasswordValidation, resetPassword);

// Google OAuth routes
router.get('/google/url', getGoogleAuthUrl);
router.post('/google/callback', googleAuthCallback);

// Protected routes
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

module.exports = router;
