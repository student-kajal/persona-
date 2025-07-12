// // const express = require('express');
// // const router = express.Router();
// // const auth = require('../middlewares/auth');
// // const { createChallan, getChallans, } = require('../controllers/challanController');
// // const challanController = require('../controllers/challanController');
// // router.get('/stock-available', challanController.getStockAvailable);

// // router.post('/', auth, createChallan);
// // router.get('/', auth, getChallans);

// // module.exports = router;
// const express = require('express');
// const router = express.Router();
// const auth = require('../middlewares/auth');
// const challanController = require('../controllers/challanController');

// // Stock availability check (No auth needed, usually for frontend AJAX)
// router.get('/stock-available', challanController.getStockAvailable);

// // Challan CRUD (secured)
// router.post('/', auth, challanController.createChallan);
// router.get('/', auth, challanController.getChallans);

// module.exports = router;
