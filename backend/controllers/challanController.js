const Challan = require('../models/Challan');
const Product = require('../models/Product');
const mongoose = require('mongoose');
// Get article variants (case-insensitive + backward compatible)
exports.getArticleVariants = async (req, res) => {
  try {
    const { article } = req.params;
    
    const products = await Product.find({
      $expr: { $eq: [{ $toUpper: "$article" }, article.toUpperCase()] },
      isDeleted: false
    }).select('size color rate pairPerCarton quantity');

    if (!products.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article not found' 
      });
    }

    const variants = products.map(p => ({
      size: p.size,
      color: p.color,
      rate: p.rate,
      pairPerCarton: p.pairPerCarton,
      quantity: p.quantity || p.cartons * p.pairPerCarton // Backward compatibility
    }));

    res.json({ success: true, data: variants });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};


// challanController.js - createChallan function fix
exports.createChallan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items } = req.body;

    // ✅ Stock check aur deduction (FIXED)
    for (const item of items) {
      const product = await Product.findOne({
        $expr: { $eq: [{ $toUpper: "$article" }, item.article.toUpperCase()] },
        size: item.size,
        color: { $regex: new RegExp(`^${item.color}$`, 'i') },
        isDeleted: false
      }).session(session);

      if (!product) {
        throw new Error(`Product not found: ${item.article}-${item.size}-${item.color}`);
      }

      // ✅ Stock calculation fix
      const availableStock = product.quantity || (product.cartons * product.pairPerCarton);
      const requiredStock = item.cartons * item.pairPerCarton;

      if (availableStock < requiredStock) {
        throw new Error(`Insufficient stock for ${item.article}. Available: ${availableStock}, Required: ${requiredStock}`);
      }

      // ✅ Stock deduction fix
      if (product.quantity !== undefined) {
        product.quantity = Math.max(0, product.quantity - requiredStock);
      } else {
        const newCartons = Math.max(0, product.cartons - item.cartons);
        product.cartons = newCartons;
        // ✅ Agar cartons 0 ho gaye, quantity bhi 0 kar do
        if (newCartons === 0) {
          product.quantity = 0;
        }
      }
      
      // ✅ Product save with session
      await product.save({ session });
    }

    // ✅ Challan create
    const challan = new Challan({
      ...req.body,
      items: req.body.items.map(item => ({
        ...item,
        article: item.article.toUpperCase(),
        color: item.color.toUpperCase()
      }))
    });

    const savedChallan = await challan.save({ session });
    await session.commitTransaction();
    
    res.status(201).json({ 
      success: true, 
      data: savedChallan 
    });

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  } finally {
    session.endSession();
  }
};

// Get all challans
exports.getAllChallans = async (req, res) => {
  try {
    const challans = await Challan.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: challans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get a specific challan by ID
exports.getChallan = async (req, res) => {
  try {
    const challan = await Challan.findById(req.params.id);
    if (!challan) {
      return res.status(404).json({ success: false, error: 'Challan not found' });
    }
    res.status(200).json({ success: true, data: challan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.getLatestInvoice = async (req, res) => {
  try {
    const latestChallan = await Challan.findOne().sort({ createdAt: -1 });
    // ✅ invoiceNo se number extract karein
    let latestInvoice = 0;
    if (latestChallan && latestChallan.invoiceNo) {
      const parts = latestChallan.invoiceNo.split('/');
      latestInvoice = parseInt(parts[0]) || 0;
    }
    res.status(200).json({ success: true, invoice: latestInvoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// Stock check logic
exports.checkStock = async (req, res) => {
  const errors = [];
  
  await Promise.all(req.body.map(async (item, index) => {
    const product = await Product.findOne({
      article: item.article,
      size: item.size,
      color: item.color,
      isDeleted: false
    });

    if (!product) {
      errors.push({
        itemIndex: index,
        message: `${item.article}-${item.size}-${item.color} stock nahi hai`
      });
      return;
    }

    if (product.cartons < item.requiredCartons) {
      errors.push({
        itemIndex: index,
        message: `${item.article} ka stock kam hai! 
                  Uplabdh: ${product.cartons}, 
                  Maang: ${item.requiredCartons}`
      });
    }
  }));

  res.json({ 
    success: errors.length === 0,
    errors,
    hasErrors: errors.length > 0
  });
};


exports.getStockAvailable = async (req, res) => {
  const article = (req.query.article || '').trim().toUpperCase();
  const size = (req.query.size || '').trim().toUpperCase();
  const color = (req.query.color || '').trim().toUpperCase();

  if (!article || !size || !color) {
    return res.status(400).json({ error: "Missing parameters" });
  }
  try {
    const product = await Product.findOne({
      $expr: { $eq: [{ $toUpper: "$article" }, article] },
      size: { $regex: `^${size}$`, $options: 'i' },
      color: { $regex: `^${color}$`, $options: 'i' },
      isDeleted: false
    });

    console.log('Stock check:', { article, size, color, product });

    if (!product) {
      return res.json({ availableCartons: 0 });
    }

    const availableCartons = (product.quantity !== undefined && product.pairPerCarton > 0)
      ? Math.floor(product.quantity / product.pairPerCarton)
      : product.cartons || 0;

    res.json({ availableCartons });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
