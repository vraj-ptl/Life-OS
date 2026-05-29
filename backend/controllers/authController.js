const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendOtpEmail, sendWelcomeEmail } = require('../utils/sendEmail');

// Helper: Generate JWT
const generateToken = (userId, rememberMe = false) => {
  const expiresIn = rememberMe ? process.env.JWT_REMEMBER_EXPIRE : process.env.JWT_EXPIRE;
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
};

// Helper: Generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
      });
    }

    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Generate token
    const token = generateToken(user._id);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Life OS.',
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
      });
    }

    const { email, password, rememberMe } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate token
    const token = generateToken(user._id, rememberMe);

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar, preferences, goals } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };
    if (goals) updateData.goals = goals;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user },
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile.',
    });
  }
};

/**
 * @desc    Forgot password - send OTP
 * @route   POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account with that email exists, an OTP has been sent.',
      });
    }

    // Generate OTP
    const otp = generateOtp();
    
    // Hash OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    // Save to user with 10-minute expiry
    user.resetOtp = hashedOtp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    await sendOtpEmail(email, otp, user.name);

    res.json({
      success: true,
      message: 'If an account with that email exists, an OTP has been sent.',
    });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending OTP.',
    });
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 */
exports.verifyOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
      });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+resetOtp +resetOtpExpiry');
    if (!user || !user.resetOtp) {
      return res.status(400).json({
        success: false,
        message: 'No OTP request found. Please request a new OTP.',
      });
    }

    // Check expiry
    if (user.resetOtpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Verify OTP
    const isValidOtp = await bcrypt.compare(otp, user.resetOtp);
    if (!isValidOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = await bcrypt.hash(resetToken, 10);

    // Store reset token with 15-minute expiry, clear OTP
    user.resetToken = hashedResetToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'OTP verified successfully.',
      data: { resetToken },
    });
  } catch (error) {
    console.error('VerifyOTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying OTP.',
    });
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
      });
    }

    const { email, resetToken, newPassword } = req.body;

    const user = await User.findOne({ email }).select('+resetToken +resetTokenExpiry');
    if (!user || !user.resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset request.',
      });
    }

    // Check expiry
    if (user.resetTokenExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please start over.',
      });
    }

    // Verify reset token
    const isValidToken = await bcrypt.compare(resetToken, user.resetToken);
    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token.',
      });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    // Generate new JWT
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successful! You are now logged in.',
      data: { token, user: user.toJSON() },
    });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password.',
    });
  }
};
