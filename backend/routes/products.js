const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload'); 
const Product = require('../models/Product'); 


const {
  createProduct,
  getProducts,
  bulkDelete,
  bulkRestore,
  importExcel,
  getStockHistory,
  getProductsByCategory,
  getSalaryReport,
  getProductById,
  updateProduct,
  getDeletedProducts,
  permanentDelete,
  getArticleOptions, 
  getArticleDetails ,
   getArticleGenderInfo,
  getArticleGenderSizeInfo,
   getAllowedGendersForArticle
} = require('../controllers/productController');


const {
  getSizePricing,
  updateSizePricing
} = require('../controllers/SizePricingController'); 



router.get('/', getProducts);


router.get('/article-options', getArticleOptions);


router.get('/suggestions', async (req, res) => {
  try {
    const { field, search } = req.query;
    const allowedFields = ['article', 'color', 'size', 'packing'];
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        error: "Invalid field. Allowed fields: article, color, size, packing"
      });
    }

    const query = search ? { [field]: { $regex: search, $options: 'i' } } : {};
    const values = await Product.distinct(field, query);
    
    res.json({
      success: true,
      data: values.filter(Boolean)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch suggestions"
    });
  }
});


router.get('/smart-article-info', getArticleDetails); 

router.get('/history', auth, getStockHistory);
router.get('/salary-report', auth, getSalaryReport);
router.get('/deleted', auth, getDeletedProducts);
router.get('/category/:stockType/:gender', getProductsByCategory);


router.get('/size-pricing', auth, getSizePricing); 
router.put('/size-pricing', auth, updateSizePricing); 

router.get('/article-gender-info', getArticleGenderInfo);
router.get('/article-gender-size-info', getArticleGenderSizeInfo);

router.get('/allowed-genders', getAllowedGendersForArticle);
router.get('/:id', auth, getProductById);
router.put('/:id', auth, upload.single('image'), updateProduct); 
router.post('/', auth, upload.single('image'), createProduct); 
router.post('/bulk-delete', auth, bulkDelete);
router.post('/bulk-restore', auth, bulkRestore);
router.post('/import', auth, importExcel);
router.post('/permanent-delete', auth, permanentDelete); 

module.exports = router;
