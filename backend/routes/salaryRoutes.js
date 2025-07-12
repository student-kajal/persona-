// routes/salary.js
const express = require('express');
const router = express.Router();
const { getSalaryReport } = require('../controllers/salaryController');
router.get('/salary-report', getSalaryReport);
module.exports = router;
