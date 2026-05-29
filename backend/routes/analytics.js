const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDashboardData } = require('../controllers/analyticsController');

router.use(auth);

router.get('/dashboard', getDashboardData);

module.exports = router;
