

const Challan = require('../models/Challan');
const Product = require('../models/Product');
const History = require('../models/History');
const SalaryEntry = require('../models/SalaryEntry'); // ✅ ADD THIS IMPORT
const mongoose = require('mongoose');

// Get article variants (case-insensitive + backward compatible)
exports.getArticleVariants = async (req, res) => {
  try {
    const { article } = req.params;

    const products = await Product.find({
      $expr: { $eq: [{ $toUpper: '$article' }, article.toUpperCase()] },
      isDeleted: false
    }).select('size color rate pairPerCarton quantity cartons cartonsChallanedOut');

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
      quantity: p.quantity || p.cartons * p.pairPerCarton,  // Backward compatible
      cartons: p.cartons,
      cartonsChallanedOut: p.cartonsChallanedOut || 0,
    }));

    res.json({ success: true, data: variants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};



// exports.createChallan = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { items } = req.body; // createdByName is not needed if using req.user

//     if (!items || !Array.isArray(items) || items.length === 0) {
//       throw new Error('No items provided');
//     }

//     // 1. Generate Unique Invoice Number
//     const year = new Date().getFullYear();
//     let latestChallan = await Challan.findOne().sort({ createdAt: -1 });
//     let nextNumber = 1;
//     if (latestChallan && latestChallan.invoiceNo) {
//       const parts = latestChallan.invoiceNo.split('/');
//       if (parts[1] == year.toString()) {
//         // Fix: Use parseInt on the number part only
//         nextNumber = (parseInt(parts[0], 10) || 0) + 1;
//       }
//     }

//     let invoiceNo;
//     let attempts = 0;
//     while (attempts < 10) {
//       invoiceNo = `${nextNumber}/${year}`;
//       const existing = await Challan.findOne({ invoiceNo });
//       if (!existing) break;
//       nextNumber++;
//       attempts++;
//     }
//     if (attempts === 10) {
//       throw new Error('Failed to generate unique invoice number.');
//     }

//     // 2. Loop through items, update stock, and create history
//     for (const item of items) {
//       const product = await Product.findOne({
//         $expr: { $eq: [{ $toUpper: '$article' }, item.article.toUpperCase()] },
//         size: item.size,
//         color: new RegExp(`^${item.color}$`, 'i'),
//         isDeleted: false
//       }).session(session);

//       if (!product) {
//         throw new Error(`Product not found: ${item.article}-${item.size}-${item.color}`);
//       }
//       if (product.cartons < item.cartons) {
//         throw new Error(`Stock insufficient for ${item.article}. Available: ${product.cartons}, Requested: ${item.cartons}`);
//       }

//       product.cartons -= item.cartons;
//       product.cartonsChallanedOut = (product.cartonsChallanedOut || 0) + item.cartons;
//       await product.save({ session });

//       // **FIXED: This block is now INSIDE the loop**
//       await History.create([{
//         product: product._id,
//         action: 'CHALLAN_OUT',
//         quantityChanged: -item.cartons,
//         updatedBy: req.user?._id,
//         updatedByName: (req.user?.username || 'SYSTEM').toUpperCase(),
//         partyName: (req.body.partyName || '').toUpperCase(),
//         invoiceNo: invoiceNo,
//         note: `Challan OUT to ${(req.body.partyName||'').toUpperCase()} (inv ${invoiceNo})`,
//         timestamp: new Date(),
//       }], { session });
//     } // <-- End of for loop

//     // 3. Prepare & Save Challan
//     const challanData = {
//       ...req.body,
//       invoiceNo,
//       items: items.map(i => ({
//         ...i,
//         article: i.article.toUpperCase(),
//         color: i.color.toUpperCase()
//       })),
//     };

//     const challan = new Challan(challanData);
//     const savedChallan = await challan.save({ session });

//     await session.commitTransaction();
//     session.endSession();
//     res.status(201).json({ success: true, data: savedChallan });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     // Log the actual error on the server
//     console.error("Challan creation failed:", error);
//     res.status(400).json({ success: false, error: error.message });
//   }
// };
exports.createChallan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('No items provided');
    }

    // 1. Generate Unique Invoice Number
    const year = new Date().getFullYear();
    let latestChallan = await Challan.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;
    if (latestChallan && latestChallan.invoiceNo) {
      const parts = latestChallan.invoiceNo.split('/');
      if (parts[1] == year.toString()) {
        nextNumber = (parseInt(parts[0], 10) || 0) + 1;
      }
    }

    let invoiceNo;
    let attempts = 0;
    while (attempts < 10) {
      invoiceNo = `${nextNumber}/${year}`;
      const existing = await Challan.findOne({ invoiceNo });
      if (!existing) break;
      nextNumber++;
      attempts++;
    }
    if (attempts === 10) {
      throw new Error('Failed to generate unique invoice number.');
    }

    // 2. Process each item
    for (const item of items) {
      const product = await Product.findOne({
        $expr: { $eq: [{ $toUpper: '$article' }, item.article.toUpperCase()] },
        size: item.size,
        color: new RegExp(`^${item.color}$`, 'i'),
        isDeleted: false
      }).session(session);

      if (!product) {
        throw new Error(`Product not found: ${item.article}-${item.size}-${item.color}`);
      }

      // ✅ Calculate ACTUAL available stock (SalaryEntry - existing challan)
      const totalSalaryAgg = await SalaryEntry.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: null, total: { $sum: "$cartons" } } }
      ]).session(session);
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
      ]).session(session);
      const existingChallanOut = challanAgg[0]?.totalOut || 0;

      const availableCartons = Math.max(0, totalSalary - existingChallanOut);

      // ✅ Stock validation
      if (availableCartons < item.cartons) {
        throw new Error(`Stock insufficient for ${item.article}. Available: ${availableCartons}, Requested: ${item.cartons}`);
      }

      // ✅ Create History entry ONLY (don't touch Product.cartons manually)
      await History.create([{
        product: product._id,
        action: 'CHALLAN_OUT',
        quantityChanged: -item.cartons,
        updatedBy: req.user?._id,
        updatedByName: (req.user?.username || 'SYSTEM').toUpperCase(),
        partyName: (req.body.partyName || '').toUpperCase(),
        invoiceNo: invoiceNo,
        note: `Challan OUT to ${(req.body.partyName||'').toUpperCase()} (inv ${invoiceNo})`,
        timestamp: new Date(),
      }], { session });

      // ✅ RECALCULATE Product.cartons from SalaryEntry - Total Challan
      const newChallanAgg = await History.aggregate([
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
      ]).session(session);
      const newTotalChallanOut = newChallanAgg[0]?.totalOut || 0;

      // ✅ CRITICAL: Recalculate from scratch
      product.cartons = Math.max(0, totalSalary - newTotalChallanOut);
      product.cartonsChallanedOut = newTotalChallanOut;
      await product.save({ session });

      console.log(`✅ Challan OUT: ${item.article} | Salary: ${totalSalary} | Challan: ${newTotalChallanOut} | Product: ${product.cartons}`);
    }

    // 3. Save Challan
    const challanData = {
      ...req.body,
      invoiceNo,
      items: items.map(i => ({
        ...i,
        article: i.article.toUpperCase(),
        color: i.color.toUpperCase()
      })),
    };

    const challan = new Challan(challanData);
    const savedChallan = await challan.save({ session });

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, data: savedChallan });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Challan creation failed:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete challan with stock revert and history tracking
exports.deleteChallan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const challan = await Challan.findById(id).session(session);
    if (!challan) {
      return res.status(404).json({ success: false, error: 'Challan not found' });
    }

    // Revert stock for each item and update cartonsChallanedOut
    for (const item of challan.items) {
      const product = await Product.findOne({
        $expr: { $eq: [{ $toUpper: '$article' }, item.article.toUpperCase()] },
        size: item.size,
        color: { $regex: new RegExp(`^${item.color}$`, 'i') },
        isDeleted: false
      }).session(session);

      if (!product) {
        throw new Error(`Product not found for revert: ${item.article}-${item.size}-${item.color}`);
      }

      const revertCartons = item.cartons;

      // Add back stock
      product.cartons = (product.cartons || 0) + revertCartons;

      // Decrease cartonsChallanedOut but not below zero
      const newChallanedOut = Math.max(0, (product.cartonsChallanedOut || 0) - revertCartons);

      if (newChallanedOut === 0) {
        product.cartonsChallanedOut = undefined; // Unset if zero (cleans up the field)
      } else {
        product.cartonsChallanedOut = newChallanedOut;
      }

      await product.save({ session });

      // History entry for CHALLAN_IN (stock in cartons)
      await History.create([{
        product: product._id,
        action: 'CHALLAN_IN',
        quantityChanged: revertCartons,
        updatedBy: req.user?.id,
        updatedByName: (req.user?.username || '').toUpperCase() || 'SYSTEM',
        partyName: challan.partyName, 
        invoiceNo: challan.invoiceNo,
        note: `Challan delete ⇒ IN for ${challan.partyName} (inv ${challan.invoiceNo})`,
        timestamp: new Date()
      }], { session });
    }

    // Delete challan doc
    await Challan.deleteOne({ _id: id }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: 'Challan deleted and stock reverted' });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: err.message });
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


// Get latest invoice number for challans
exports.getLatestInvoice = async (req, res) => {
  try {
    const latestChallan = await Challan.findOne().sort({ createdAt: -1 });
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


// Stock check logic for cartons for list of items (can use for create challan validation)
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
        message: `${item.article} ka stock kam hai! Uplabdh: ${product.cartons}, Maang: ${item.requiredCartons}`
      });
    }
  }));

  res.json({
    success: errors.length === 0,
    errors,
    hasErrors: errors.length > 0
  });
};


// Get available stock for UI (in cartons)
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

    if (!product) {
      return res.json({ availableCartons: 0 });
    }

    const availableCartons = product.cartons || 0;

    res.json({ availableCartons });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};


// controllers/challanController.js
exports.getPartyNames = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    if (!search) {
      return res.json({ success: true, data: [] });
    }

    // ✅ STARTS WITH वाले matches के लिए regex:
    const regex = new RegExp(`^${search}`, 'i'); // ^ => शुरू से match

    const names = await Challan.aggregate([
      { $match: { partyName: { $regex: regex } } },
      { $group: { _id: "$partyName" } },
      { $sort: { _id: 1 } }, // A-Z sort
     
    ]);

    res.json({ success: true, data: names.map(n => n._id) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.getArticleSuggestions = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    if (!search) {
      return res.json({ success: true, data: [] });
    }

    // STARTS WITH regex
    const regex = new RegExp(`^${search}`, 'i');

    const articles = await Product.aggregate([
      { $match: { article: { $regex: regex }, isDeleted: false } },
      { $group: { _id: "$article" } },
      { $sort: { _id: 1 } },
     
    ]);

    res.json({ success: true, data: articles.map(a => a._id) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.getPartySummaryV2 = async (req, res) => {
  try {
    const party = (req.query.party || '').trim().toUpperCase();
    const fromQ = req.query.from;
    const toQ = req.query.to;

    const match = {};
    if (party) match.partyName = party;

    if (fromQ || toQ) {
      match.createdAt = {};
      if (fromQ) {
        const start = new Date(fromQ);
        start.setHours(0,0,0,0);
        match.createdAt.$gte = start;
      }
      if (toQ) {
        const end = new Date(toQ);
        end.setHours(0,0,0,0);
        end.setDate(end.getDate() + 1); // next day 00:00 exclusive
        match.createdAt.$lt = end;
      }
    }

    const tz = 'Asia/Kolkata';

    const result = await Challan.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $project: {
          partyName: 1,
          createdAt: 1,
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz } },
          article: '$items.article',
          color: '$items.color',
          size: '$items.size',
          rate: '$items.rate',
          cartons: '$items.cartons',
          amount: '$items.amount'
      }},
      {
        $facet: {
          perParty: [
            { $group: { _id: '$partyName', cartons: { $sum: '$cartons' }, amount: { $sum: '$amount' } } },
            { $project: { _id: 0, partyName: '$_id', cartons: 1, amount: 1 } },
            { $sort: { partyName: 1 } }
          ],
          perArticle: [
            { $group: {
                _id: { party: '$partyName', article: '$article', color: '$color', size: '$size', rate: '$rate',date: '$date' },
                cartons: { $sum: '$cartons' },
                amount: { $sum: '$amount' }
            }},
            { $project: {
                _id: 0,
                partyName: '$_id.party',
                date: '$_id.date', 
                article: '$_id.article',
                color: '$_id.color',
                size: '$_id.size',
                rate: '$_id.rate',
                cartons: 1,
                amount: 1
            }},
            { $sort: { partyName: 1, article: 1, color: 1, size: 1, rate: 1 } }
          ],
          perDay: [
            { $group: { _id: { party: '$partyName', date: '$date' }, cartons: { $sum: '$cartons' }, amount: { $sum: '$amount' } } },
            { $project: { _id: 0, partyName: '$_id.party', date: '$_id.date', cartons: 1, amount: 1 } },
            { $sort: { date: 1 } }
          ]
        }
      }
    ]);

    res.json({ success: true, data: result[0] || { perParty: [], perArticle: [], perDay: [] } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.getPartyNames = async (req, res) => {
  try {
    // Lower/empty search will match all
    const search = (req.query.search || '').trim();
    const regex = search ? new RegExp(`^${search}`, "i") : /.*/;
    const parties = await Challan.aggregate([
      { $match: { partyName: { $regex: regex } } },
      { $group: { _id: "$partyName" } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, data: parties.map(p => p._id) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

