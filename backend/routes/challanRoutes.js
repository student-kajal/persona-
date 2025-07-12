
const express = require('express');
const router = express.Router();
const challanController = require('../controllers/challanController');

// ✅ Latest invoice route (BEFORE /:id route)
router.get('/latest-invoice', challanController.getLatestInvoice);

// ✅ Article variants route  
router.get('/article/:article/variants', challanController.getArticleVariants);
// Stock check ke liye naya route
router.post('/stock-check', challanController.checkStock);
router.get('/stock-available', challanController.getStockAvailable); // <-- यह route ज़रूर add करें
// ✅ CRUD routes
router.post('/', challanController.createChallan);
router.get('/', challanController.getAllChallans);
router.get('/:id', challanController.getChallan);

module.exports = router;
