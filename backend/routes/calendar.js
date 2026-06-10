const express = require('express');
const router = express.Router();
const { getCalendarData } = require('../controllers/calendarController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', getCalendarData);

module.exports = router;
