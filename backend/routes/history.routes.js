// const express = require('express');
// const router = express.Router();
// const historyController = require('../controllers/historyController');
// // const { authMiddleware } = require('../middlewares/auth.middleware'); // agar aap laga rahe ho to

// // router.get('/', authMiddleware, historyController.getHistory);
// router.get('/', historyController.getHistory);

// module.exports = router;
// // LOCATION: server/routes/history.routes.js
const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

// Get all history entries with filters
router.get('/', historyController.getHistory);
//router.post('/permanent-delete', historyController.permanentDeleteAndProduct);
//router.get('/party-summary', historyController.getPartySummary);
// Delete history entry and revert stock
router.delete('/:id', historyController.deleteHistoryEntry);
router.post('/permanent-delete-article', historyController.permanentDeleteArticleAndResetSalaries);


module.exports = router;
