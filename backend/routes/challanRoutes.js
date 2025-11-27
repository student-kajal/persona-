

const express = require('express');
const router = express.Router();
const challanController = require('../controllers/challanController');

// Specific routes FIRST
router.get('/party-summary', challanController.getPartySummaryV2);
router.get('/latest-invoice', challanController.getLatestInvoice);
router.get('/article/:article/variants', challanController.getArticleVariants);
router.get('/article-suggestions', challanController.getArticleSuggestions);
router.get('/party-names', challanController.getPartyNames);
router.post('/stock-check', challanController.checkStock);
router.get('/stock-available', challanController.getStockAvailable);

// General list/create
router.post('/', challanController.createChallan);
router.get('/', challanController.getAllChallans);
router.get('/party-names', challanController.getPartyNames);
// Param route LAST
router.get('/:id', challanController.getChallan);
// Without auth middleware
router.put('/:id', challanController.updateChallan); // ✅ No auth

router.delete('/:id', challanController.deleteChallan); // Also add delete route
router.post('/migrate-challan-ids', challanController.migrateChallanIds);
module.exports = router;
