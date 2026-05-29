const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  res.json({ success: true, message: 'Notifications route - coming soon', data: [] });
});

module.exports = router;
