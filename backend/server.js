require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const fallbackOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : [fallbackOrigin];

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting on all API routes
app.use('/api', apiLimiter);

// ─── Routes ────────────────────────────────────────
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const habitRoutes = require('./routes/habits');
const financeRoutes = require('./routes/finance');
const analyticsRoutes = require('./routes/analytics');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Life OS API is running ⚡',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists.`,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const requiredConfig = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL'];
  const missingRequired = requiredConfig.filter((key) => !process.env[key]);
  const googleConfig = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  const missingGoogle = googleConfig.filter((key) => !process.env[key]);

  console.log(`\n⚡ Life OS Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}\n`);
  console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);

  if (missingRequired.length > 0) {
    console.warn(`⚠️  Missing required env vars: ${missingRequired.join(', ')}`);
  }

  if (missingGoogle.length > 0) {
    console.warn(`⚠️  Missing Google OAuth env vars: ${missingGoogle.join(', ')}`);
  }
});

module.exports = app;
