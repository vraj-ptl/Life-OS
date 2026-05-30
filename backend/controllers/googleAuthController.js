const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// We will use the frontend callback page as the redirect URI
const getRedirectUri = () => `${process.env.FRONTEND_URL}/google/callback`;

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
};

exports.getGoogleAuthUrl = (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();
    
    // Generate an authentication URL
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required to get a refresh token
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://mail.google.com/',
        'https://www.googleapis.com/auth/calendar'
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

    // Save tokens and connection status
    user.gmailConnected = true;
    user.gmailTokens = tokens;
    user.calendarConnected = true;
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
    res.status(500).json({ success: false, message: 'Failed to authenticate with Google' });
  }
};
