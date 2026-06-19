const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send OTP email for password reset
 */
const sendOtpEmail = async (to, otp, userName) => {
  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0a0a1a; color: #e0e0e0; margin: 0; padding: 0; }
        .container { max-width: 500px; margin: 40px auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.3); }
        .logo { text-align: center; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; }
        .greeting { font-size: 16px; color: #a0a0b0; margin-bottom: 20px; }
        .otp-box { text-align: center; background: rgba(139, 92, 246, 0.1); border: 2px dashed rgba(139, 92, 246, 0.4); border-radius: 12px; padding: 24px; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #8b5cf6; font-family: 'Courier New', monospace; }
        .expiry { text-align: center; color: #f59e0b; font-size: 14px; margin-top: 16px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">⚡ Life OS</div>
        <div class="greeting">Hi ${userName || 'there'},</div>
        <p style="color: #c0c0d0;">You requested a password reset. Use the code below to verify your identity:</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <div class="expiry">⏰ This code expires in 10 minutes</div>
        <p style="color: #888; font-size: 13px; margin-top: 20px;">If you didn't request this, please ignore this email. Your account is safe.</p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Life OS — Your AI-Powered Life Admin
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Life OS" <noreply@lifeos.app>',
    to,
    subject: '🔐 Life OS — Password Reset OTP',
    html: htmlContent,
    text: `Your Life OS password reset OTP is: ${otp}. It expires in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send welcome email after registration
 */
const sendWelcomeEmail = async (to, userName) => {
  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0a0a1a; color: #e0e0e0; margin: 0; padding: 0; }
        .container { max-width: 500px; margin: 40px auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.3); }
        .logo { text-align: center; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; }
        .greeting { font-size: 20px; font-weight: 600; color: #f0f0f0; margin-bottom: 12px; }
        .feature { display: flex; align-items: center; padding: 8px 0; color: #c0c0d0; font-size: 14px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">⚡ Life OS</div>
        <div class="greeting">Welcome aboard, ${userName}! 🎉</div>
        <p style="color: #a0a0b0;">Your AI-powered life admin is ready. Here's what you can do:</p>
        <div class="feature">📋 Smart Task Management with AI scheduling</div>
        <div class="feature">🔥 Habit Tracking with predictive analytics</div>
        <div class="feature">💰 Finance Management with smart categorization</div>
        <div class="feature">📧 Email Summarization & action extraction</div>
        <div class="feature">📊 Life Analytics Dashboard</div>
        <div class="feature">🎮 Gamification — earn XP and badges!</div>
        <p style="color: #8b5cf6; font-weight: 500; margin-top: 20px;">Start by setting your goals and adding your first task!</p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Life OS — Your AI-Powered Life Admin
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Life OS" <noreply@lifeos.app>',
    to,
    subject: '🚀 Welcome to Life OS!',
    html: htmlContent,
    text: `Welcome to Life OS, ${userName}! Your AI-powered life admin is ready.`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    // Don't fail registration if welcome email fails
    console.error('Welcome email failed:', error.message);
  }
};

module.exports = { sendOtpEmail, sendWelcomeEmail };
