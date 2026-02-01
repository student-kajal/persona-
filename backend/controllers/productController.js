// exports.getSalaryReport = async (req, res) => {
//   try {
//     const { from, to, worker } = req.query;

//     const query = {
//       createdAt: {
//         $gte: new Date(from),
//         $lte: new Date(to + 'T23:59:59.999Z')
//       }
//     };

//     if (worker && worker !== 'all') {
//       query.createdBy = worker.toUpperCase();
//     }

//     // ✅ Ab SalaryEntry ke sath product bhi le aayenge
//     let records = await SalaryEntry.find(query)
//       .populate({
//         path: 'product',
//         match: { isDeleted: false }, // Sirf wo product jinka isDeleted=false ho
//         select: '_id'
//       })
//       .select('createdBy article gender cartons pairPerCarton totalPairs createdAt product');

//     // ✅ Filter karo jisme product null ho (iska matlab product delete ho gaya hai)
//     records = records.filter(r => r.product);

//     const workerContributions = {};

//     records.forEach(record => {
//       const w = record.createdBy;
//       const art = record.article;
//       const dateStr = record.createdAt.toISOString().split('T')[0];

//       if (!workerContributions[w]) {
//         workerContributions[w] = { worker: w, articles: [] };
//       }

//       workerContributions[w].articles.push({
//         article: art,
//         gender: record.gender,
//         cartons: record.cartons,
//         pairs: record.totalPairs,
//         date: dateStr
//       });
//     });

//     const report = Object.values(workerContributions);

//     res.json({ success: true, data: report });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// 6. Get Products (with filters)
// exports.getProducts = async (req, res) => {
//   try {
//     const {
//       search,
//       stockType,
//       gender,
//       color,
//       size,
//       minCartons,
//       maxCartons,
//       sortBy = 'article',
//       sortOrder = 'asc'
//     } = req.query;

//     const filter = { isDeleted: false };
//     const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

//     if (search) filter.article = { $regex: search, $options: 'i' };
//     if (stockType) filter.stockType = stockType;
//     if (gender) filter.gender = gender;
//     if (color) filter.color = { $regex: `^${color}$`, $options: 'i' };

//     if (size) filter.size = size;
//     if (minCartons) filter.cartons = { $gte: Number(minCartons) };
//     if (maxCartons) filter.cartons = { ...filter.cartons, $lte: Number(maxCartons) };

//     const products = await Product.find(filter)
//       .sort(sortOptions);

//     res.json({
//       success: true,
//       count: products.length,
//       data: products
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       error: err.message
//     });
//   }
// };



// exports.getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

//     const currentUser = (req.query.createdBy || '').toUpperCase();

//     // 1. Total cartons for current user
//     let userCartons = 0;
//     if (currentUser) {
//       const userAgg = await SalaryEntry.aggregate([
//         { $match: {
//             createdBy: currentUser,
//             article: product.article.toUpperCase(),
//             gender: product.gender.toLowerCase(),
//             product: product._id
//         }},
//         { $group: { _id: null, total: { $sum: "$cartons" } } }
//       ]);
//       userCartons = userAgg[0]?.total || 0;
//     }

//     // 2. Find original creator
//     const firstHistory = await History.findOne({
//       product: product._id,
//       action: 'ADD'
//     }).sort({ timestamp: 1 });
//     const originalCreator = firstHistory
//       ? (firstHistory.updatedByName || firstHistory.updatedBy || 'UNKNOWN_USER')
//       : product.createdBy || 'UNKNOWN_USER';

//     // 3. Aggregate total cartons from all users
//     const agg = await SalaryEntry.aggregate([
//       { $match: { product: product._id } },
//       { $group: { _id: null, total: { $sum: "$cartons" } } }
//     ]);
//     const totalCartons = agg[0]?.total || 0;

//     // 4. Send response
//     res.json({
//       success: true,
//       data: {
//         ...product.toObject(),
//         cartons: userCartons,
//         createdBy: currentUser,
//         originalCreator: originalCreator
//       },
//       totalCartons,
//     });
//   } catch (err) {
//     console.error('getProductById error:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };



// // ✅ FIXED updateProduct - Target specific user's salary
// exports.updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const targetUser = (req.body.createdBy || '').toUpperCase(); // User jiska edit ho raha hai
//    // const newCartons = Number(req.body.cartons) || 0;
// const increment = Number(req.body.cartons) || 0;
//     const product = await Product.findById(id);
//     if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

//     // 1. Find TARGET USER's current SalaryEntry for the product
//     let userEntry = await SalaryEntry.findOne({
//       createdBy: targetUser, // ✅ FIXED: Target specific user
//       article: product.article,
//       gender: product.gender,
//       product: id,
//     }).sort({ createdAt: -1 });

//     const oldCartons = userEntry?.cartons || 0;
//    // const diff = newCartons - oldCartons;
// const newCartons = oldCartons + increment;
// const diff = increment;

//     // 2. Update or create the SalaryEntry for TARGET USER only
//     if (userEntry) {
//       userEntry.cartons = newCartons;
//       userEntry.totalPairs = newCartons * product.pairPerCarton;
//       await userEntry.save();
//     } else {
//       // Create new entry for target user
//       userEntry = await SalaryEntry.create({
//         createdBy: targetUser,
//         article: product.article,
//         gender: product.gender,
//        // cartons: newCartons,
//         cartons: increment, 
//         pairPerCarton: product.pairPerCarton,
//         totalPairs: newCartons * product.pairPerCarton,
//         product: id,
//       });
//     }

//     // 3. Recalculate total cartons for product from all users
//     const agg = await SalaryEntry.aggregate([
//       { $match: { product: product._id } },
//       { $group: { _id: null, total: { $sum: "$cartons" } } }
//     ]);
//     product.cartons = agg[0]?.total || 0;
//     await product.save();

//     // 4. Add history record only if cartons changed
//     if (diff !== 0) {
//       await History.create({
//         product: product._id,
//         action: 'UPDATE',
//        // oldValue: oldCartons,
//         oldValue: oldCartons,
//         newValue: newCartons,
//        // quantityChanged: diff,
//        quantityChanged: diff,
//         updatedBy: req.user?.id,
//         updatedByName: targetUser, // ✅ Target user ka naam
//         note: `${targetUser} updated cartons from ${oldCartons} to ${newCartons}`,
//         timestamp: new Date(),
        
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Product updated successfully',
//       data: product,
//       totalCartons: product.cartons,
//     });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };

// exports.getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

//     const currentUser = (req.query.createdBy || '').toUpperCase();

//     // ✅ 1. Total cartons for current user from SalaryEntry
//     let userCartons = 0;
//     if (currentUser) {
//       const userAgg = await SalaryEntry.aggregate([
//         { $match: {
//             createdBy: currentUser,
//             article: product.article.toUpperCase(),
//             gender: product.gender.toLowerCase(),
//             product: product._id
//         }},
//         { $group: { _id: null, total: { $sum: "$cartons" } } }
//       ]);
//       userCartons = userAgg[0]?.total || 0;
//     }

//     // ✅ 2. Calculate user's challan reduction
//     const totalSalaryCartons = await SalaryEntry.aggregate([
//       { $match: { product: product._id } },
//       { $group: { _id: null, total: { $sum: "$cartons" } } }
//     ]);

//     const totalChallanOuts = await History.aggregate([
//       {
//         $match: {
//           product: product._id,
//           action: 'CHALLAN_OUT'
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           totalOut: { $sum: { $abs: '$quantityChanged' } }
//         }
//       }
//     ]);

//     const totalSalary = totalSalaryCartons[0]?.total || 0;
//     const totalChallanOut = totalChallanOuts[0]?.totalOut || 0;

//     // ✅ Calculate user's proportional challan reduction
//     let userChallanReduction = 0;
//     if (totalSalary > 0 && totalChallanOut > 0 && currentUser) {
//       const userRatio = userCartons / totalSalary;
//       userChallanReduction = Math.floor(totalChallanOut * userRatio);
//     }

//     // ✅ ACTUAL user available = SalaryEntry - user's challan share
//     const actualUserCartons = Math.max(0, userCartons - userChallanReduction);

//     // 3. Find original creator
//     const firstHistory = await History.findOne({
//       product: product._id,
//       action: 'ADD'
//     }).sort({ timestamp: 1 });
//     const originalCreator = firstHistory
//       ? (firstHistory.updatedByName || firstHistory.updatedBy || 'UNKNOWN_USER')
//       : product.createdBy || 'UNKNOWN_USER';

//     // ✅ 4. Total available cartons = Total SalaryEntry - Total challan outs
//     const totalAvailableCartons = Math.max(0, totalSalary - totalChallanOut);

//     // 5. Send response with ACTUAL available cartons
//     res.json({
//       success: true,
//       data: {
//         ...product.toObject(),
//         cartons: actualUserCartons, // ✅ Show actual available after challan reduction
//         createdBy: currentUser,
//         originalCreator: originalCreator
//       },
//       totalCartons: totalAvailableCartons, // ✅ Total actual available
//     });
//   } catch (err) {
//     console.error('getProductById error:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

const Product = require('../models/Product');
const SalaryEntry = require('../models/SalaryEntry');
const History = require('../models/History');  // <-- Import History model

const { exportToExcel, importFromExcel } = require('../utils/excel');
const multer = require('multer');
const fs = require('fs');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    const currentUser = (req.query.createdBy || '').toUpperCase();

    // ✅ 1. Get user's RAW SalaryEntry value (no challan deduction for user display)
    let userCartons = 0;
    if (currentUser) {
      const userAgg = await SalaryEntry.aggregate([
        { $match: {
            createdBy: currentUser,
            article: product.article.toUpperCase(),
            gender: product.gender.toLowerCase(),
            product: product._id
        }},
        { $group: { _id: null, total: { $sum: "$cartons" } } }
      ]);
      userCartons = userAgg[0]?.total || 0;
    }

    // ✅ 2. Get total SalaryEntry (for Product.cartons calculation)
    const totalSalaryAgg = await SalaryEntry.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, total: { $sum: "$cartons" } } }
    ]);
    const totalSalary = totalSalaryAgg[0]?.total || 0;

    // ✅ 3. Get total challan out
    const challanAgg = await History.aggregate([
      {
        $match: {
          product: product._id,
          action: 'CHALLAN_OUT'
        }
      },
      {
        $group: {
          _id: null,
          totalOut: { $sum: { $abs: '$quantityChanged' } }
        }
      }
    ]);
    const totalChallanOut = challanAgg[0]?.totalOut || 0;

    // ✅ 4. Product.cartons = Total Salary - Challan
   // const totalAvailableCartons = Math.max(0, totalSalary - totalChallanOut);
   const totalAvailableCartons = totalSalary - totalChallanOut;


    // ✅ 5. Find original creator
    const firstHistory = await History.findOne({
      product: product._id,
      action: 'ADD'
    }).sort({ timestamp: 1 });
    const originalCreator = firstHistory
      ? (firstHistory.updatedByName || firstHistory.updatedBy || 'UNKNOWN_USER')
      : product.createdBy || 'UNKNOWN_USER';

    // ✅ 6. Send RAW user cartons (no deduction for user view)
    res.json({
      success: true,
      data: {
        ...product.toObject(),
        cartons: userCartons, // ✅ RAW SalaryEntry value for this user
        createdBy: currentUser,
        originalCreator: originalCreator
      },
      totalCartons: totalAvailableCartons, // ✅ Overall product total (after challan)
    });
  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = (req.body.createdBy || '').toUpperCase();
    const newUserCartons = Number(req.body.cartons) || 0; // ✅ Direct value from frontend

    console.log(`🚀 UPDATE REQUEST: User=${targetUser}, NewValue=${newUserCartons}, ProductId=${id}`);

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    // ✅ 1. Get user's current SalaryEntry (raw value)
    let userEntry = await SalaryEntry.findOne({
      createdBy: targetUser,
      article: product.article.toUpperCase(),
      gender: product.gender.toLowerCase(),
      product: product._id
    }).sort({ createdAt: -1 });

    const oldUserSalaryCartons = userEntry?.cartons || 0;
    const userChange = newUserCartons - oldUserSalaryCartons;

    console.log(`📊 SalaryEntry Update: ${oldUserSalaryCartons} → ${newUserCartons} (change: ${userChange})`);

    // ✅ 2. Update SalaryEntry with direct value
    if (userEntry) {
      userEntry.cartons = newUserCartons; // ✅ CORRECT: Direct value
      userEntry.totalPairs = newUserCartons * product.pairPerCarton;
      await userEntry.save();
    } else {
      userEntry = await SalaryEntry.create({
        createdBy: targetUser,
        article: product.article.toUpperCase(),
        gender: product.gender.toLowerCase(),
        cartons: newUserCartons, // ✅ CORRECT: Direct value
        pairPerCarton: product.pairPerCarton,
        totalPairs: newUserCartons * product.pairPerCarton,
        product: id
      });
    }

    // ✅ 3. Recalculate Product.cartons (SalaryEntry total - Challan)
    const totalSalaryAgg = await SalaryEntry.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, total: { $sum: "$cartons" } } }
    ]);
    const totalSalary = totalSalaryAgg[0]?.total || 0;

    const challanAgg = await History.aggregate([
      {
        $match: {
          product: product._id,
          action: 'CHALLAN_OUT'
        }
      },
      {
        $group: {
          _id: null,
          totalOut: { $sum: { $abs: '$quantityChanged' } }
        }
      }
    ]);
    const totalChallanOut = challanAgg[0]?.totalOut || 0;

  //  product.cartons = Math.max(0, totalSalary - totalChallanOut);
  product.cartons = totalSalary - totalChallanOut;

    await product.save();

    console.log(`📦 Product.cartons: ${totalSalary} (salary) - ${totalChallanOut} (challan) = ${product.cartons}`);

    // ✅ 4. History record
    if (userChange !== 0) {
      await History.create({
        product: product._id,
        action: 'UPDATE',
        oldValue: oldUserSalaryCartons,
        newValue: newUserCartons,
        quantityChanged: userChange,
        updatedBy: req.user?.id,
        updatedByName: targetUser,
         articleText: product.article, 
        note: `${targetUser} updated cartons from ${oldUserSalaryCartons} to ${newUserCartons}`,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
      totalCartons: product.cartons // ✅ Display value (after challan)
    });
  } catch (err) {
    console.error('❌ updateProduct error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};



exports.createProduct = async (req, res) => {
  console.log("Create Product Request Body:", req.body);
  try {
    const requiredFields = ['article', 'stockType', 'gender', 'createdBy', 'mrp', 'rate'];
    const missing = requiredFields.filter(field => !req.body[field]);
    if (missing.length) {
      return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(', ')}` });
    }

    const productData = {
      article: (req.body.article || '').toUpperCase().trim(),
      stockType: (req.body.stockType || '').toLowerCase().trim(),
      gender: (req.body.gender || '').toLowerCase().trim(),
      color: (req.body.color || '').toUpperCase().trim(),
      size: (req.body.size || '').trim(),
      pairPerCarton: Number(req.body.pairPerCarton) || 0,
      mrp: Number(req.body.mrp),
      rate: parseFloat(Number(req.body.rate).toFixed(2)),
      series: (req.body.series || '').toUpperCase().trim(),
      cartons: Number(req.body.cartons) || 0,
      createdBy: (req.body.createdBy || '').toUpperCase().trim(),
    };
    
    // if (req.file) {
    //   productData.image = req.file.path;
    // }
     // ✅ Cloudinary URL
    if (req.file && req.file.path) {
      productData.image = req.file.path;   // e.g. https://res.cloudinary.com/.../image/upload/...
    }

    const matchQuery = {
      article: productData.article,
      stockType: productData.stockType,
      gender: productData.gender,
      color: productData.color,
      size: productData.size,
    };

    let product = await Product.findOne(matchQuery);
    let isNewProduct = false;
    if (!product) {
      product = new Product(productData);
      await product.save();
      isNewProduct = true;
    }

    const cartonsToAdd = productData.cartons;

    let existingUserEntry = await SalaryEntry.findOne({
      createdBy: productData.createdBy,
      article: productData.article,
      gender: productData.gender,
      product: product._id,
    }).sort({ createdAt: -1 });

    if (existingUserEntry) {
      console.log(`🔄 UPDATING existing SalaryEntry for ${productData.createdBy}: ${existingUserEntry.cartons} + ${cartonsToAdd} = ${existingUserEntry.cartons + cartonsToAdd}`);
      
      existingUserEntry.cartons += cartonsToAdd;
      existingUserEntry.totalPairs = existingUserEntry.cartons * productData.pairPerCarton;
      await existingUserEntry.save();
      
      // ✅ FIX 1: Wait for write to complete
      await new Promise(resolve => setImmediate(resolve));
      
      await History.create({
        product: product._id,
        action: 'UPDATE',
        salaryEntryId: existingUserEntry._id,
        quantityChanged: cartonsToAdd,
        updatedByName: productData.createdBy,
         articleText: product.article, 
        note: `${productData.createdBy} added ${cartonsToAdd} cartons to existing product`,
        timestamp: new Date(),
      });
    } else {
      console.log(`🆕 CREATING new SalaryEntry for ${productData.createdBy} with ${cartonsToAdd} cartons`);
      
      const newSalaryEntry = await SalaryEntry.create({
        createdBy: productData.createdBy,
        article: productData.article,
        gender: productData.gender,
        cartons: cartonsToAdd,
        pairPerCarton: productData.pairPerCarton,
        totalPairs: cartonsToAdd * productData.pairPerCarton,
        product: product._id,
      });

      // ✅ FIX 1: Wait for write to complete
      await new Promise(resolve => setImmediate(resolve));

      await History.create({
        product: product._id,
        action: isNewProduct ? 'ADD' : 'UPDATE',
        salaryEntryId: newSalaryEntry._id,
        quantityChanged: cartonsToAdd,
        updatedByName: productData.createdBy,
         articleText: product.article, 
        note: isNewProduct ? 'New product created' : 'Added cartons to existing product',
        timestamp: new Date(),
      });
    }

    // ✅ FIX 2: Aggregation with fallback to manual count
    const agg = await SalaryEntry.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, total: { $sum: "$cartons" } } }
    ]);
    const totalSalaryCartons = agg[0]?.total || 0;

    let finalSalaryTotal = totalSalaryCartons;
    if (totalSalaryCartons === 0) {
      console.log("⚠️ Aggregation returned 0, doing manual count...");
      const manualEntries = await SalaryEntry.find({ product: product._id }).select('cartons');
      finalSalaryTotal = manualEntries.reduce((sum, entry) => sum + entry.cartons, 0);
      console.log(`✅ Manual count: ${finalSalaryTotal}`);
    }

    const challanReductions = await History.aggregate([
      {
        $match: {
          product: product._id,
          action: 'CHALLAN_OUT'
        }
      },
      {
        $group: {
          _id: null,
          totalOut: { $sum: { $abs: '$quantityChanged' } }
        }
      }
    ]);
    
    const totalChallanOut = challanReductions[0]?.totalOut || 0;
    
    // ✅ FIX 3: Use finalSalaryTotal
   // product.cartons = Math.max(0, finalSalaryTotal - totalChallanOut);
   product.cartons = finalSalaryTotal - totalChallanOut;

    await product.save();

    console.log(`✅ FINAL: SalaryEntry Total=${finalSalaryTotal}, Challan Out=${totalChallanOut}, Product Total=${product.cartons}`);

    res.status(201).json({
      success: true,
      message: 'Product created/updated successfully',
      data: product,
    });
  } catch (err) {
    console.error("Create Product Error:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};



// 4. Get Stock History (OPTIONAL: Now recommended to use separate History collection API)
exports.getStockHistory = async (req, res) => {
  // If you want to keep old embedded history aggregation, else create new HistoryController and route
  res.status(501).json({ success: false, error: 'Use new History API endpoint /api/history' });
};

// // new 
 // 6. Get Products (with filters) - ✅ OPTIMIZED VERSION
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      stockType,
      gender,
      color,
      size,
      minCartons,
      maxCartons,
      sortBy = 'article',
      sortOrder = 'asc'
    } = req.query;

    const filter = { isDeleted: false };
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    if (search) filter.article = { $regex: search, $options: 'i' };
    if (stockType) filter.stockType = stockType;
    if (gender) filter.gender = gender;
    if (color) filter.color = { $regex: `^${color}$`, $options: 'i' };
    if (size) filter.size = size;

    const products = await Product.find(filter).sort(sortOptions).lean();
    const productIds = products.map(p => p._id);

    // ✅ OPTIMIZATION: Batch aggregate for ALL products at once
    const salaryTotals = await SalaryEntry.aggregate([
      { $match: { product: { $in: productIds } } },
      { 
        $group: { 
          _id: '$product', 
          total: { $sum: '$cartons' } 
        } 
      }
    ]);

    const challanTotals = await History.aggregate([
      {
        $match: {
          product: { $in: productIds },
          action: 'CHALLAN_OUT'
        }
      },
      {
        $group: {
          _id: '$product',
          totalOut: { $sum: { $abs: '$quantityChanged' } }
        }
      }
    ]);

    // ✅ Create lookup maps for fast access
    const salaryMap = new Map();
    salaryTotals.forEach(s => salaryMap.set(s._id.toString(), s.total));

    const challanMap = new Map();
    challanTotals.forEach(c => challanMap.set(c._id.toString(), c.totalOut));

    // ✅ Update product cartons in memory
    let finalProducts = products.map(product => {
      const productIdStr = product._id.toString();
      const totalSalary = salaryMap.get(productIdStr) || 0;
      const totalChallan = challanMap.get(productIdStr) || 0;
      
      // return {
      //   ...product,
      //   cartons: Math.max(0, totalSalary - totalChallan)
      // };
      return {
  ...product,
  cartons: totalSalary - totalChallan,
  warning: (totalSalary - totalChallan) < 0   // 👈 optional but recommended
};

    });

    // ✅ Apply carton filters AFTER recalculation
    if (minCartons !== undefined) {
      finalProducts = finalProducts.filter(p => p.cartons >= Number(minCartons));
    }
    if (maxCartons !== undefined) {
      finalProducts = finalProducts.filter(p => p.cartons <= Number(maxCartons));
    }

    res.json({
      success: true,
      count: finalProducts.length,
      data: finalProducts
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// 7. Bulk Delete
exports.bulkDelete = async (req, res) => {
  try {
    const { ids, updatedByName } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product IDs format'
      });
    }

    const products = await Product.find({ _id: { $in: ids } });

    await Promise.all(products.map(async (product) => {
      if (product.isDeleted) return;
      product.isDeleted = true;
      await product.save();

      await History.create({
        product: product._id,
        action: 'DELETE',
        quantityChanged: -(product.cartons * product.pairPerCarton),
        updatedBy: req.user?.id,
        updatedByName,
        articleText: product.article,

        note: 'Bulk delete',
        timestamp: new Date()
      });
    }));

    res.json({
      success: true,
      deletedCount: products.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// 8. Bulk Restore
exports.bulkRestore = async (req, res) => {
  try {
    const { ids, updatedByName } = req.body;

    const products = await Product.find({ _id: { $in: ids } });

    await Promise.all(products.map(async (product) => {
      if (!product.isDeleted) return;
      product.isDeleted = false;
      await product.save();

      await History.create({
        product: product._id,
        action: 'BULK_RESTORE',
        quantityChanged: product.cartons * product.pairPerCarton,
        updatedBy: req.user?.id,
        updatedByName,
         articleText: product.article,

        note: 'Bulk restore',
        timestamp: new Date()
      });
    }));

    res.json({
      success: true,
      restoredCount: products.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// 9. Excel Import (with History entry)
exports.importExcel = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const productsData = importFromExcel(req.file.path);
      const genderOptions = ['gents', 'ladies', 'kids_male', 'kids_female'];

      const results = await Promise.allSettled(
        productsData.map(async (row) => {
          try {
            const requiredFields = ['Article', 'Stock Type', 'Gender', 'CreatedBy', 'MRP', 'Rate'];
            requiredFields.forEach(field => {
              if (!row[field]) throw new Error(`Missing ${field}`);
            });

            const gender = row.Gender.toLowerCase();
            if (!genderOptions.includes(gender)) {
              throw new Error(`Invalid gender: ${row.Gender}`);
            }

            const productData = {
              article: row.Article,
              stockType: row['Stock Type'].toLowerCase(),
              gender,
              color: row.Color || '',
              size: row.Size || '',
              cartons: Number(row.Cartons) || 0,
              pairPerCarton: Number(row['Pair/Carton']) || 0,
              mrp: Number(row.MRP),
              rate: Number(row.Rate),
              series: row.Series || '',
              createdBy: row['Created By'] || ''
            };

            const updatedProduct = await Product.findOneAndUpdate(
              {
                article: productData.article,
                stockType: productData.stockType,
                gender: productData.gender,
                color: productData.color,
                size: productData.size
              },
              { $set: productData },
              { upsert: true, new: true }
            );

            await History.create({
              product: updatedProduct._id,
              action: 'IMPORT',
              quantityChanged: updatedProduct.cartons * updatedProduct.pairPerCarton,
              updatedBy: req.user?.id,
              updatedByName: productData.createdBy,
               articleText: updatedProduct.article, 
              note: 'Imported via Excel',
              timestamp: new Date()
            });

            return updatedProduct;
          } catch (error) {
            throw error;
          }
        })
      );

      fs.unlinkSync(req.file.path);

      const successfulImports = results.filter(r => r.status === 'fulfilled').length;
      const errors = results.filter(r => r.status === 'rejected').map(r => r.reason.message);

      res.json({
        success: true,
        importedCount: successfulImports,
        errors
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
];

// ... (rest of your methods unchanged; history is not involved)


// 10. Get Products by Category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { stockType, gender } = req.params;

    const products = await Product.find({
      stockType: stockType.toLowerCase(),
      gender: gender.toLowerCase(),
      isDeleted: false
    });

    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 11. Get Deleted Products
exports.getDeletedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: true }).sort({ article: 1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 12. Permanent Delete
exports.permanentDelete = async (req, res) => {
  const { selectedIds } = req.body;

  try {
    await Product.deleteMany({ _id: { $in: selectedIds } });
    res.status(200).json({ message: "Products permanently deleted." });
  } catch (err) {
    res.status(500).json({ message: "Error deleting products", error: err });
  }
};

// 13. Get Sizes & Colors by Article
exports.getArticleOptions = async (req, res) => {
  try {
    const { article } = req.query;
    if (!article) return res.status(400).json({ success: false, error: "Article is required" });

    const products = await Product.find({ article, isDeleted: false });

    const sizes = [...new Set(products.map(p => p.size).filter(Boolean))];
    const colors = [...new Set(products.map(p => p.color).filter(Boolean))];

    res.json({
      success: true,
      sizes,
      colors
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// 14. Get Smart Details for an Article + Gender
exports.getArticleDetails = async (req, res) => {
  try {
    const { article, gender } = req.query;
    if (!article) {
      return res.status(400).json({ success: false, error: "Article is required" });
    }

    let product = null;

    if (gender) {
      // Agar gender diya hai, toh sirf usi gender ka product do
      product = await Product.findOne({
        article: article,
        gender: gender.toLowerCase(),
        isDeleted: false
      }).sort({ updatedAt: -1 });

      // Agar gender diya hai, lekin product nahi mila, toh empty object bhejo
      if (!product) {
        return res.json({ success: true, data: {} });
      }
    } else {
      // Gender nahi diya: sirf article ka latest product do (stockType/image freeze ke liye)
      product = await Product.findOne({
        article: article,
        isDeleted: false
      }).sort({ updatedAt: -1 });
      if (!product) {
        return res.json({ success: true, data: {} });
      }
    }

    res.json({
      success: true,
      data: {
        stockType: product.stockType,
        mrp: product.mrp,
        rate: product.rate,
        series: product.series || "",
        pairPerCarton: product.pairPerCarton,
        image: product.image || ""
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.getArticleGenderInfo = async (req, res) => {
  try {
    const { article, gender } = req.query;
    const searchCriteria = {
      article: article.toUpperCase(),
      gender: gender.toLowerCase(),
      isDeleted: false
    };

    let productWithImage = await Product.findOne({
      ...searchCriteria,
      image: { $exists: true, $ne: null, $ne: "" }
    }).sort({ updatedAt: -1 });

    const response = {
      success: true,
      data: {
        image: productWithImage?.image || null,
        fieldsLocked: {
          image: !!productWithImage?.image,   // ✅ Only image lock here
        }
      }
    };

    return res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};



exports.getArticleGenderSizeInfo = async (req, res) => {
  try {
    const { article, gender, size } = req.query;
    if (!article || !gender || !size) {
      return res.status(400).json({ success: false, error: "Article, Gender, Size required" });
    }

    const product = await Product.findOne({
      article: article.toUpperCase(),
      gender: gender.toLowerCase(),
      size: size,
      isDeleted: false
    }).sort({ updatedAt: -1 });

    if (product) {
      return res.json({
        success: true,
        data: {
          pairPerCarton: product.pairPerCarton || 0,
          series: product.series || "",
          mrp: product.mrp || 0,
          rate: product.rate || 0,
          fieldsLocked: {
            pairPerCarton: true,
            series: true,
            mrp: true,
            rate: true
          }
        }
      });
    } else {
      return res.json({ success: false, data: null });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.getAllowedGendersForArticle = async (req, res) => {
  try {
    const { article } = req.query;
    if (!article) {
      return res.status(400).json({ success: false, error: "Article is required" });
    }

    const genderSet = await Product.distinct("gender", {
      article: article.toUpperCase(),
      isDeleted: false
    });

    const lowerSet = genderSet.map(g => g.toLowerCase());

    // Debug: Show what genders are found for this article
    console.log("Article:", article, "| DB Genders:", genderSet, "| lowerSet:", lowerSet);

    const allowed = new Set();

    if (lowerSet.length === 0) {
      // New article => allow all genders
      allowed.add("gents");
      allowed.add("ladies");
      allowed.add("kids_gents");
      allowed.add("kids_ladies");
    } else {
      // If either gents or kids_gents exists, allow both
      if (lowerSet.includes("gents") || lowerSet.includes("kids_gents")) {
        allowed.add("gents");
        allowed.add("kids_gents");
      }
      // If either ladies or kids_ladies exists, allow both
      if (lowerSet.includes("ladies") || lowerSet.includes("kids_ladies")) {
        allowed.add("ladies");
        allowed.add("kids_ladies");
      }
    }

    // Debug: Show what will be sent to frontend
    console.log("Allowed genders to send:", [...allowed]);

    return res.json({
      success: true,
      allowedGenders: [...allowed]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all SalaryEntry (user carton breakdowns) for one product by ID
exports.getAllUserEntriesForProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Find all SalaryEntry records for this product
    const entries = await SalaryEntry.find({ product: productId })
      .select('createdBy cartons pairPerCarton totalPairs createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: entries
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


