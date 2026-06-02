const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const getMissingGoogleConfig = () => {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'FRONTEND_URL'];
  return required.filter((key) => !process.env[key]);
};

// We will use the frontend callback page as the redirect URI
const getRedirectUri = () => {
  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
  return `${frontendUrl}/google/callback`;
};

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
};

exports.getGoogleAuthUrl = (req, res) => {
  try {
    const missingConfig = getMissingGoogleConfig();
    if (missingConfig.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing Google OAuth config: ${missingConfig.join(', ')}`,
      });
    }

    const oauth2Client = getOAuth2Client();
    
    // Generate an authentication URL
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required to get a refresh token
      scope: [
        'openid',
        'email',
        'profile'
      ],
      prompt: 'consent' // Force to get refresh token
    });

    res.json({ success: true, data: { url } });
  } catch (error) {
    console.error('Error generating Google Auth URL:', error);
    res.status(500).json({ success: false, message: 'Failed to generate auth URL' });
  }
};

exports.googleAuthCallback = async (req, res) => {
  try {
    const missingConfig = getMissingGoogleConfig();
    if (missingConfig.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing Google OAuth config: ${missingConfig.join(', ')}`,
      });
    }

    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code is required' });
    }

    const oauth2Client = getOAuth2Client();
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    const { email, name, picture } = userInfo.data;

    if (!email) {
      return res.status(400).json({ success: false, message: 'No email found in Google profile' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      // Create a random password since one is required by the schema but they log in with Google
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      user = new User({
        name: name || 'Google User',
        email,
        password: randomPassword,
        avatar: picture || '',
      });
    } else {
      // Update avatar if we didn't have one
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
    }

    // Save sign-in tokens and reset third-party connection status.
    user.gmailConnected = false;
    user.gmailTokens = tokens;
    user.calendarConnected = false;
    user.calendarTokens = tokens;

    await user.save();

    // Generate our JWT token for Life-OS
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        token,
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('Google Auth Callback Error:', error);
    const googleErrorCode =
      error?.response?.data?.error ||
      error?.response?.data?.error_description ||
      error?.message ||
      '';

    if (typeof googleErrorCode === 'string' && googleErrorCode.includes('invalid_grant')) {
      return res.status(400).json({
        success: false,
        message: 'Google authorization code expired. Please try signing in again.',
      });
    }

    if (typeof googleErrorCode === 'string' && googleErrorCode.includes('redirect_uri_mismatch')) {
      return res.status(400).json({
        success: false,
        message: 'Google redirect URI mismatch. Check FRONTEND_URL and Google Console settings.',
      });
    }

    res.status(500).json({ success: false, message: 'Failed to authenticate with Google' });
  }
};
