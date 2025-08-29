// // routes/salary.js
// const express = require('express');
// const router = express.Router();
// const { getSalaryReport,patchSalaryEntry,getSalaryEntryById } = require('../controllers/salaryController');
// router.get('/salary-report', getSalaryReport);

// router.patch('/:id',patchSalaryEntry);
// router.get('/salary-entry/:id', getSalaryEntryById);
// module.exports = router;
const express = require('express');
const router = express.Router();
const { 
  getSalaryReport,
  patchSalaryEntry,
  getSalaryEntryById 
} = require('../controllers/salaryController');

// GET /api/salary/report (Isko bhi thoda aasan kar diya)
router.get('/salary-report', getSalaryReport);


// PATCH /api/salary/:id
router.patch('/:id', patchSalaryEntry);

// ✅ FIX: Is route ko saral (simple) kar diya hai
// Ab yeh GET /api/salary/:id par request lega
router.get('/:id', getSalaryEntryById);

module.exports = router;
