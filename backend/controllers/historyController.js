
// // LOCATION: server/controllers/historyController.js
const History = require('../models/History');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const Challan = require('../models/Challan');

const SalaryEntry = require('../models/SalaryEntry');

// PATCH: server/controllers/historyController.js
exports.getHistory = async (req, res) => {
  try {
    const { productId, action, userId, from, to } = req.query;
    const filter = {};
    if (productId) filter.product = productId;
    if (action) filter.action = action;
    if (userId) filter.updatedBy = userId;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }
    let history = await History.find(filter)
      .populate('product', 'article gender size color')
      .populate('updatedBy', 'username')
      .sort({ timestamp: -1 })
      .lean(); // Now document is plain JS Object

    // PATCH: assign blank product if missing (so frontend never fails)
    history = history.map(h => {
      if (!h.product) {
        h.product = { article: '', gender: '', size: '', color: '' };
      }
      if (!h.updatedByName && h.updatedBy && h.updatedBy.username) {
    h.updatedByName = h.updatedBy.username;
  }
      return h;
    });
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};



exports.deleteHistoryEntry = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const historyEntry = await History.findById(id).session(session).populate('product');
    if (!historyEntry) {
      return res.status(404).json({ success: false, error: 'History record not found' });
    }

    const action = historyEntry.action;
    const product = historyEntry.product;
    if (!product) throw new Error('Associated product not found');

    // Only allow certain actions
    if (!['CHALLAN_OUT', 'CHALLAN_IN', 'UPDATE', 'ADD'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Deletion not allowed for this history entry' });
    }

    const cartonChange = historyEntry.quantityChanged;

    // === 1️⃣ Handle CHALLAN actions (keep existing logic) ===
    if (action === 'CHALLAN_OUT') {
      product.cartons += Math.abs(cartonChange);
      product.cartonsChallanedOut = Math.max(0, (product.cartonsChallanedOut || 0) - Math.abs(cartonChange));
      await product.save({ session });
    } else if (action === 'CHALLAN_IN') {
      product.cartons = Math.max(0, product.cartons - cartonChange);
      product.cartonsChallanedOut = (product.cartonsChallanedOut || 0) + cartonChange;
      await product.save({ session });
    }

    // === 2️⃣ Handle ADD/UPDATE actions ===
    if (['UPDATE', 'ADD'].includes(action)) {
      // First revert the salary entry
      await SalaryEntry.findOneAndUpdate(
        {
          createdBy: historyEntry.updatedByName, // ✅ FIXED: Use history user
          article: product.article,
          gender: product.gender,
          createdAt: {
            $gte: new Date(historyEntry.timestamp.setHours(0, 0, 0, 0)), // ✅ FIXED: Use history timestamp  
            $lte: new Date(historyEntry.timestamp.setHours(23, 59, 59, 999))
          }
        },
        {
          $inc: {
            cartons: -cartonChange, 
            totalPairs: -(cartonChange * product.pairPerCarton)
          }
        },
        { session }
      );

      // ✅ NEW: Recalculate product.cartons from ALL SalaryEntry records
      const agg = await SalaryEntry.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: null, total: { $sum: "$cartons" } } }
      ]).session(session);
      
      product.cartons = agg[0]?.total || 0;
      await product.save({ session });
    }

    // === 3️⃣ Handle CHALLAN revert (keep existing) ===
    if (action === 'CHALLAN_OUT' && historyEntry.invoiceNo) {
      const challan = await Challan.findOne({ invoiceNo: historyEntry.invoiceNo }).session(session);
      if (challan) {
        challan.items = challan.items.filter(item => 
          !(
            item.article.toUpperCase() === product.article.toUpperCase() &&
            item.size === product.size &&
            item.color.toUpperCase() === product.color.toUpperCase()
          )
        );
        if (challan.items.length === 0) {
          await Challan.deleteOne({ _id: challan._id }).session(session);
        } else {
          await challan.save({ session });
        }
      }
    }

    // === 4️⃣ Delete the history entry ===
    await History.deleteOne({ _id: id }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: 'History entry deleted, stock, salary, and challan reverted' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.permanentDeleteArticleAndResetSalaries = async (req, res) => {
  try {
    const { article, gender, size, color } = req.body;
    
    if (!article) return res.status(400).json({ success: false, error: 'article required' });

    // 1. Product query (include size/color for product delete)
    const productQuery = { article: new RegExp(`^${article}$`, 'i') };
    if (gender) productQuery.gender = new RegExp(`^${gender}$`, 'i');
    if (size)   productQuery.size   = size;
    if (color)  productQuery.color  = new RegExp(`^${color}$`, 'i');

    const products   = await Product.find(productQuery);
    const productIds = products.map(p => p._id);

    await Product.deleteMany({ _id: { $in: productIds } });
    await History.deleteMany({ product: { $in: productIds } });

    // 2. Salary reset query (NO size/color, only article+gender as per schema)
    const salaryQuery = { article: new RegExp(`^${article}$`, 'i') };
    if (gender) salaryQuery.gender = new RegExp(`^${gender}$`, 'i');

    // Debug print
    const matches = await SalaryEntry.find(salaryQuery);
    console.log('Salaries matched:', matches.length, salaryQuery);

    const result = await SalaryEntry.updateMany(
      salaryQuery,
      { $set: { cartons: 0, totalPairs: 0 } }
    );
    console.log('Salary reset result:', result);

    res.json({ 
      success: true, 
      message: `✅ Deleted ${productIds.length} product(s); zeroed ${result.modifiedCount} salary entrie(s).`
    });
  } catch (err) {
    console.error('Permanent delete error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};


