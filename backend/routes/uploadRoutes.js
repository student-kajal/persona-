const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');
const { storage: cloudinaryStorage } = require('../config/cloudinary');

// Local disk storage (original)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const uploadDisk = multer({
  storage: diskStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed!'), false);
    }
  }
});

// Cloudinary storage for article images
const uploadCloud = multer({ storage: cloudinaryStorage });

// Original route (local disk)
router.post('/image', uploadDisk.single('image'), (req, res) => {
  try {
    if (req.file) {
      res.json({
        success: true,
        imageUrl: `/uploads/products/${req.file.filename}`
      });
    } else {
      res.status(400).json({ success: false, error: 'No image uploaded' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Upload image to Cloudinary + update ALL products with same article
router.post('/article-image', auth, uploadCloud.single('image'), async (req, res) => {
  try {
    const article = (req.body.article || '').trim();
    if (!article) {
      return res.status(400).json({ success: false, error: 'Article is required' });
    }
    const imageUrl = req.file?.path;
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }

    const result = await Product.updateMany(
      { article: { $regex: new RegExp(`^${article}$`, 'i') } },
      { $set: { image: imageUrl } }
    );

    res.json({ success: true, imageUrl, updatedCount: result.modifiedCount });
  } catch (err) {
    console.error('article-image upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
