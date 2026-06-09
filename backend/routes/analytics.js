const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDashboardData, getDetailedAnalytics } = require('../controllers/analyticsController');

router.use(auth);

router.get('/dashboard', getDashboardData);
router.get('/detailed', getDetailedAnalytics);

module.exports = router;
