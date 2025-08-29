// const Product = require('../models/Product');
// const SalaryEntry = require('../models/SalaryEntry');

// const { exportToExcel, importFromExcel } = require('../utils/excel');
// const multer = require('multer');
// const fs = require('fs');

// const upload = multer({ dest: 'uploads/' });


// // ========================
// // Core CRUD Operations
// // ========================

// // 1. Get Single Product by ID
// exports.getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       return res.status(404).json({ success: false, error: 'Product not found' });
//     }
//     res.json({ success: true, data: product });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// // 2. Update Product by ID
// exports.updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updatedData = {
//       ...req.body,
//       cartons: Number(req.body.cartons),
//       pairPerCarton: Number(req.body.pairPerCarton),
//       mrp: Number(req.body.mrp),
//       rate: Number(req.body.rate),
//       series: (req.body.series || '').toUpperCase(),         // ✅
//       createdBy: (req.body.createdBy || '').toUpperCase(),   // ✅
//     };

//     const product = await Product.findByIdAndUpdate(
//       id,
//       {
//         $set: updatedData,
//         $push: {
//           history: {
//             action: 'updated',
//             updatedBy: req.user?.id,
//             updatedByName: updatedData.createdBy,
//             changes: updatedData,
//             timestamp: new Date()
//           }
//         }
//       },
//       { new: true }
//     );

//     if (!product) {
//       return res.status(404).json({ success: false, error: 'Product not found' });
//     }

//     res.json({
//       success: true,
//       message: 'Product updated successfully',
//       data: product
//     });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };


// exports.createProduct = async (req, res) => {
//   try {
//     const requiredFields = ['article', 'stockType', 'gender', 'createdBy', 'mrp', 'rate', 'series'];
//     const missing = requiredFields.filter(field => !req.body[field]);

    
//     if (missing.length) {
//       return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(', ')}` });
//     }

//     const productData = {
//       //article: req.body.article,
//       article: (req.body.article || '').toUpperCase(),
//       stockType: req.body.stockType.toLowerCase(),
//       gender: req.body.gender.toLowerCase(),
//      // color: req.body.color || '',
//      color: (req.body.color || '').toUpperCase(), // ✅ Convert to uppercase
//       size: req.body.size || '',
//       cartons: Number(req.body.cartons) || 0,
//       pairPerCarton: Number(req.body.pairPerCarton) || 0,
//       mrp: Number(req.body.mrp),
//       rate: Number(req.body.rate),
//       series: (req.body.series || '').toUpperCase(),
//       createdBy: (req.body.createdBy || '').toUpperCase(),
//     };

//     if (req.file) {
//       productData.image = `/uploads/${req.file.filename}`;
//     }

//     const matchQuery = {
//       article: productData.article,
//       stockType: productData.stockType,
//       gender: productData.gender,
//       color: productData.color,
//       size: productData.size
//     };

//     // Check if product exists
//     let existing = await Product.findOne(matchQuery);

//     if (existing) {
//       // Add cartons if exists
//       const newCartons = existing.cartons + productData.cartons;
//       const updatedProduct = await Product.findOneAndUpdate(
//         matchQuery,
//         {
//           $set: {
//             ...productData,
//             cartons: newCartons
//           },
//           $push: {
//             history: {
//               action: 'created_or_updated',
//               updatedBy: req.user?.id,
//               updatedByName: productData.createdBy,
//               changes: { ...productData, cartons: newCartons },
//               timestamp: new Date()
//             }
//           }
//         },
//         { new: true }
        
//       );
//       productData.totalPairs = productData.cartons * productData.pairPerCarton;
//        await SalaryEntry.create({
//         createdBy: productData.createdBy.toUpperCase(),
//         article: productData.article,
//         cartons: productData.cartons,
//         pairPerCarton: productData.pairPerCarton,
//         totalPairs: productData.totalPairs
//       });
//       return res.status(200).json({
//         success: true,
//         message: 'Product quantity updated!',
//         data: updatedProduct
//       });
//     } else {
//       // Create new product if not exists
//       const newProduct = new Product(productData);
//       await newProduct.save();
//       productData.totalPairs = productData.cartons * productData.pairPerCarton;
//        await SalaryEntry.create({
//         createdBy: productData.createdBy.toUpperCase(),
//         article: productData.article,
//         cartons: productData.cartons,
//         pairPerCarton: productData.pairPerCarton,
//         totalPairs: productData.totalPairs
//       });
//       return res.status(200).json({
//         success: true,
//         message: 'New product added!',
//         data: newProduct
//       });
//     }
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };


// // ========================
// // Advanced Features (unchanged except createdBy/series)
// // ========================

// // 4. Get Stock History
// exports.getStockHistory = async (req, res) => {
//   try {
//     const history = await Product.aggregate([
//       { $match: { history: { $exists: true, $ne: [] } } },
//       { $unwind: "$history" },
//       {
//         $project: {
//           _id: 0,
//           product: "$article",
//           action: "$history.action",
//           user: "$history.updatedByName",
//           changes: "$history.changes",
//           timestamp: "$history.timestamp"
//         }
//       },
//       { $sort: { timestamp: -1 } }
//     ]);
//     res.json({ success: true, data: history });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// // 5. Get Salary Report
// //const SalaryEntry = require('../models/SalaryEntry');

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

//     const records = await SalaryEntry.find(query)
//       .select('createdBy article cartons pairPerCarton totalPairs createdAt');

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


// // 6. Get Products (with filters)
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
//    // if (color) filter.color = color;
//    if (color) filter.color = { $regex: `^${color}$`, $options: 'i' };

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

// // 7. Bulk Delete
// exports.bulkDelete = async (req, res) => {
//   try {
//     const { ids, updatedByName } = req.body;

//     if (!ids || !Array.isArray(ids)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid product IDs format'
//       });
//     }

//     const result = await Product.updateMany(
//       { _id: { $in: ids } },
//       {
//         isDeleted: true,
//         $push: {
//           history: {
//             action: 'bulk_deleted',
//             updatedBy: req.user?.id,
//             updatedByName,
//             timestamp: new Date()
//           }
//         }
//       }
//     );

//     res.json({
//       success: true,
//       deletedCount: result.modifiedCount
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       error: err.message
//     });
//   }
// };

// // 8. Bulk Restore
// exports.bulkRestore = async (req, res) => {
//   try {
//     const { ids, updatedByName } = req.body;

//     const result = await Product.updateMany(
//       { _id: { $in: ids } },
//       {
//         isDeleted: false,
//         $push: {
//           history: {
//             action: 'bulk_restored',
//             updatedBy: req.user?.id,
//             updatedByName,
//             timestamp: new Date()
//           }
//         }
//       }
//     );

//     res.json({
//       success: true,
//       restoredCount: result.modifiedCount
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       error: err.message
//     });
//   }
// };

// // 9. Excel Import (series & createdBy)
// exports.importExcel = [
//   upload.single('file'),
//   async (req, res) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//       }
//       const productsData = importFromExcel(req.file.path);
//       const genderOptions = ['gents', 'ladies', 'kids_male', 'kids_female'];
//       const results = await Promise.allSettled(
//         productsData.map(async (row) => {
//           try {
//             const requiredFields = ['Article', 'Stock Type', 'Gender', 'CreatedBy', 'MRP', 'Rate', 'series'];
//             requiredFields.forEach(field => {
//               if (!row[field]) throw new Error(`Missing ${field}`);
//             });

//             const gender = row.Gender.toLowerCase();
//             if (!genderOptions.includes(gender)) {
//               throw new Error(`Invalid gender: ${row.Gender}`);
//             }

//             const productData = {
//               article: row.Article,
//               stockType: row['Stock Type'].toLowerCase(),
//               gender,
//               color: row.Color || '',
//               size: row.Size || '',
//               cartons: Number(row.Cartons) || 0,
//               pairPerCarton: Number(row['Pair/Carton']) || 0,
//               mrp: Number(row.MRP),
//               rate: Number(row.Rate),
//               series: row.Series || '',          // ✅
//               createdBy: row['Created By'] || '',// ✅
//             };

//             return await Product.findOneAndUpdate(
//               {
//                 article: productData.article,
//                 stockType: productData.stockType,
//                 gender: productData.gender,
//                 color: productData.color,
//                 size: productData.size
//               },
//               {
//                 $set: productData,
//                 $push: {
//                   history: {
//                     action: 'imported',
//                     updatedBy: req.user?.id,
//                     updatedByName: productData.createdBy,
//                     changes: productData,
//                     timestamp: new Date()
//                   }
//                 }
//               },
//               { upsert: true, new: true }
//             );
//           } catch (error) {
//             throw error;
//           }
//         })
//       );

//       fs.unlinkSync(req.file.path);

//       const successfulImports = results.filter(r => r.status === 'fulfilled').length;
//       const errors = results.filter(r => r.status === 'rejected').map(r => r.reason.message);

//       res.json({
//         success: true,
//         importedCount: successfulImports,
//         errors
//       });
//     } catch (err) {
//       res.status(500).json({ success: false, error: err.message });
//     }
//   }
// ];



// exports.updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Parse and prepare updated fields
//     const updatedData = {
//       ...req.body,
//       cartons: Number(req.body.cartons),
//       pairPerCarton: Number(req.body.pairPerCarton),
//       mrp: Number(req.body.mrp),
//       rate: Number(req.body.rate),
//       series: (req.body.series || '').toUpperCase(),
//       createdBy: (req.body.createdBy || '').toUpperCase(),
      
//     };

//     // 1. Get existing product to compare cartons
//     const oldProduct = await Product.findById(id);
//     if (!oldProduct) {
//       return res.status(404).json({ success: false, error: 'Product not found' });
//     }
//     const oldCartons = oldProduct.cartons || 0;

//     // 2. Update product document
//     const product = await Product.findByIdAndUpdate(
//       id,
//       { $set: updatedData },
//       { new: true }
//     );
//     if (!product) {
//       return res.status(404).json({ success: false, error: 'Product not found after update' });
//     }

//     // ✅ 3. Update related SalaryEntry
//     await SalaryEntry.findOneAndUpdate(
//       {
//         createdBy: product.createdBy,
//         article: product.article,
//         gender: product.gender, // agar gender bhi track kar rahe ho
//         createdAt: {
//           $gte: new Date(product.createdAt.setHours(0, 0, 0, 0)),
//           $lte: new Date(product.createdAt.setHours(23, 59, 59, 999))
//         }
//       },
//       {
//         cartons: updatedData.cartons,
//         pairPerCarton: updatedData.pairPerCarton,
//         totalPairs: updatedData.cartons * updatedData.pairPerCarton,
//         product: newProduct._id  
//       }
//     );

//     // 4. Create History entry if cartons changed
//     const cartonsChanged = updatedData.cartons - oldCartons;
//     if (cartonsChanged !== 0) {
//       await History.create({
//         product: product._id,
//         action: 'UPDATE',
//         quantityChanged: cartonsChanged, // Only cartons difference
//         noOfCrtn: cartonsChanged,
//         pairPerCarton: updatedData.pairPerCarton,
//         updatedBy: req.user?.id,
//         updatedByName: updatedData.createdBy,
//         note: 'Product cartons updated',
//         timestamp: new Date(),
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Product updated successfully',
//       data: product,
//     });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };


// exports.updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Parse update fields
//     const updatedData = {
//       ...req.body,
//       cartons: Number(req.body.cartons),
//       pairPerCarton: Number(req.body.pairPerCarton),
//       mrp: Number(req.body.mrp),
//       rate: Number(req.body.rate),
//       series: (req.body.series || '').toUpperCase(),
//       createdBy: (req.body.createdBy || '').toUpperCase(),
//     };

//     // 1. Get old product
//     const oldProduct = await Product.findById(id);
//     if (!oldProduct) {
//       return res.status(404).json({ success: false, error: 'Product not found' });
//     }

//     const oldCartons = oldProduct.cartons || 0;

//     // 2. Update product (overwrite createdBy to last user)
//     const product = await Product.findByIdAndUpdate(
//       id,
//       { $set: updatedData },
//       { new: true }
//     );

//     if (!product) {
//       return res.status(404).json({ success: false, error: 'Product not found after update' });
//     }

//     // 3. Calculate carton difference
//     const cartonsChanged = updatedData.cartons - oldCartons;

//     if (cartonsChanged !== 0) {
//       // 3a. SalaryEntry: create new entry for THIS update
//       await SalaryEntry.create({
//         createdBy: updatedData.createdBy,
//         article: product.article,
//         gender: product.gender,
//         cartons: cartonsChanged,  // ✅ सिर्फ difference log करें
//         pairPerCarton: product.pairPerCarton,
//         totalPairs: cartonsChanged * product.pairPerCarton,
//         product: product._id
//       });

//       // 3b. History: track cartons difference
//       await History.create({
//         product: product._id,
//         action: 'UPDATE',
//         quantityChanged: cartonsChanged,
//         noOfCrtn: cartonsChanged,
//         pairPerCarton: updatedData.pairPerCarton,
//         updatedBy: req.user?.id,
//         updatedByName: updatedData.createdBy,
//         note: 'Product cartons updated',
//         timestamp: new Date(),
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Product updated successfully',
//       data: product,
//     });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };

// //3.create 
// exports.createProduct = async (req, res) => {
//   try {
//     const requiredFields = ['article', 'stockType', 'gender', 'createdBy', 'mrp', 'rate'];
//     const missing = requiredFields.filter(field => !req.body[field]);

//     if (missing.length) {
//       return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(', ')}` });
//     }

//     const productData = {
//       article: (req.body.article || '').toUpperCase(),
//       stockType: req.body.stockType.toLowerCase(),
//       gender: req.body.gender.toLowerCase(),
//       color: (req.body.color || '').toUpperCase(),
//       size: req.body.size || '',
//       cartons: Number(req.body.cartons) || 0,
//       pairPerCarton: Number(req.body.pairPerCarton) || 0,
//       mrp: Number(req.body.mrp),
//       //rate: Number(req.body.rate),
//         rate: parseFloat(Number(req.body.rate).toFixed(2)), 
//       series: (req.body.series || '').toUpperCase(),
//       createdBy: (req.body.createdBy || '').toUpperCase(),
//     };

//     if (req.file) {
//       //productData.image = `/uploads/${req.file.filename}`;
//       productData.image = req.file.path; // Cloudinary URL!
//     }

//     const matchQuery = {
//       article: productData.article,
//       stockType: productData.stockType,
//       gender: productData.gender,
//       color: productData.color,
//       size: productData.size
//     };

//     // Check if product exists
//     let existing = await Product.findOne(matchQuery);

//     if (existing) {
//       // Add cartons to existing product
//       const newCartons = existing.cartons + productData.cartons;

//       const updatedProduct = await Product.findOneAndUpdate(
//         matchQuery,
//         {
//           $set: {
//             ...productData,
//             cartons: newCartons
//           }
//         },
//         { new: true }
//       );

//       // Create History entry for cartons added - ONLY cartons count, do NOT multiply by pairPerCarton
//       await History.create({
//         product: updatedProduct._id,
//         action: 'UPDATE',
//         quantityChanged: productData.cartons,    // <-- cartons count only
//         noOfCrtn: productData.cartons,            // <-- cartons count explicitly
//         pairPerCarton: productData.pairPerCarton, // <-- pairs per carton (for reference)
//         updatedBy: req.user?.id,
//         updatedByName: productData.createdBy,
//         note: 'Added cartons to existing product',
//         timestamp: new Date()
//       });

//       // For SalaryEntry and other purposes, you can still calculate totalPairs if needed
//       productData.totalPairs = productData.cartons * productData.pairPerCarton;
//       await SalaryEntry.create({
//         createdBy: productData.createdBy,
//         article: productData.article,
//          gender: productData.gender,   
//         cartons: productData.cartons,
//         pairPerCarton: productData.pairPerCarton,
//         totalPairs: productData.totalPairs,
//           product: newProduct._id   // ✅ link
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Product quantity updated!',
//         data: updatedProduct
//       });
//     } else {
//       // Create new product
//       const newProduct = new Product(productData);
//       await newProduct.save();

//       // Create History entry for new product - track cartons only
//       await History.create({
//         product: newProduct._id,
//         action: 'ADD',
//         quantityChanged: newProduct.cartons,     // <-- cartons count only
//         noOfCrtn: newProduct.cartons,
//         pairPerCarton: newProduct.pairPerCarton,
//         updatedBy: req.user?.id,
//         updatedByName: newProduct.createdBy,
//         note: 'New product added',
//         timestamp: new Date()
//       });

//       // For SalaryEntry
//       productData.totalPairs = productData.cartons * productData.pairPerCarton;
//       await SalaryEntry.create({
//         createdBy: productData.createdBy,
//         article: productData.article,
//          gender: productData.gender,
//         cartons: productData.cartons,
//         pairPerCarton: productData.pairPerCarton,
//         totalPairs: productData.totalPairs,
//         product: newProduct._id  
//       });

//       return res.status(201).json({
//         success: true,
//         message: 'New product added!',
//         data: newProduct
//       });
//     }
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };
// Create Product


//const upload = multer({ dest: 'uploads/' });

// ========================
// Core CRUD Operations
// ========================

// 1. Get Single Product by ID
// exports.getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       return res.status(404).json({ success: false, error: 'Product not found' });
//     }
//     res.json({ success: true, data: product });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// exports.createProduct = async (req, res) => {
//   try {
//     const requiredFields = ['article', 'stockType', 'gender', 'createdBy', 'mrp', 'rate'];
//     const missing = requiredFields.filter(field => !req.body[field]);

//     if (missing.length) {
//       return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(', ')}` });
//     }

//     const productData = {
//       article: (req.body.article || '').toUpperCase(),
//       stockType: (req.body.stockType || '').toLowerCase(),
//       gender: (req.body.gender || '').toLowerCase(),
//       color: (req.body.color || '').toUpperCase(),
//       size: (req.body.size || ''),
//       cartons: Number(req.body.cartons) || 0,
//       pairPerCarton: Number(req.body.pairPerCarton) || 0,
//       mrp: Number(req.body.mrp),
//       rate: parseFloat(Number(req.body.rate).toFixed(2)),
//       series: (req.body.series || '').toUpperCase(),
//       createdBy: (req.body.createdBy || '').toUpperCase(),
//     };

//     if (req.file) {
//       productData.image = req.file.path;
//     }

//     const matchQuery = {
//       article: productData.article,
//       stockType: productData.stockType,
//       gender: productData.gender,
//       color: productData.color,
//       size: productData.size,
//     };

//     let existing = await Product.findOne(matchQuery);
//     let updatedProduct;
//     let newCartons;

//     if (existing) {
//       // Add cartons to existing product
//       newCartons = existing.cartons + productData.cartons;

//       updatedProduct = await Product.findOneAndUpdate(
//         matchQuery,
//         {
//           $set: {
//             ...productData,
//             cartons: newCartons,
//             createdBy: productData.createdBy,
//           },
//         },
//         { new: true }
//       );

//       await History.create({
//         product: updatedProduct._id,
//         action: 'UPDATE',
//         quantityChanged: productData.cartons,
//         noOfCrtn: productData.cartons,
//         pairPerCarton: productData.pairPerCarton,
//         updatedBy: req.user?.id,
//         updatedName: productData.createdBy,
//         note: 'Added cartons to existing product',
//         timestamp: new Date(),
//       });
//     } else {
//       // Create new product
//       newCartons = productData.cartons;
//       updatedProduct = new Product({
//         ...productData,
//         cartons: newCartons,
//       });
//       await updatedProduct.save();

//       await History.create({
//         product: updatedProduct._id,
//         action: 'ADD',
//         quantityChanged: newCartons,
//         noOfCrtn: newCartons,
//         pairPerCarton: productData.pairPerCarton,
//         updatedBy: req.user?.id,
//         updatedName: productData.createdBy,
//         note: 'New product added',
//         timestamp: new Date(),
//       });
//     }

//     // totalPairs calculate for frontend use (ignore for backend)
//     const totalPairs = newCartons * productData.pairPerCarton;

//     await SalaryEntry.create({
//       createdBy: productData.createdBy,
//       article: productData.article,
//       gender: productData.gender,
//       //cartons: newCartons,
//         cartons: productData.cartons,
//       pairPerCarton: productData.pairPerCarton,
//       totalPairs, // optional, frontend can calculate on-the-fly
//       product: updatedProduct._id,
//     });
// // Product का cartons recalc करो (must be after SalaryEntry.create)
// const sumCartonsAgg = await SalaryEntry.aggregate([
//   { $match: { product: updatedProduct._id } },
//   { $group: { _id: null, total: { $sum: "$cartons" } } }
// ]);
// await Product.findByIdAndUpdate(
//   updatedProduct._id,
//   { cartons: sumCartonsAgg[0]?.total || 0 }
// );

//     res.status(existing ? 200 : 201).json({
//       success: true,
//       message: existing ? 'Product updated successfully' : 'New product added',
//       data: updatedProduct,
//     });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };
// exports.updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const createdBy = (req.body.createdBy || '').toUpperCase();
//     const newCartons = Number(req.body.cartons) || 0;

//     // Find original product
//     const product = await Product.findById(id);
//     if (!product) {
//       return res.status(404).json({ success: false, error: 'Product not found' });
//     }

//     // Find this user's last SalaryEntry for this product
//     let userEntry = await SalaryEntry.findOne({
//       createdBy,              // current user (Rahul/Kajal)
//       article: product.article,
//       gender: product.gender,
//       product: id
//     }).sort({ createdAt: -1 });

//     const oldCartons = userEntry?.cartons || 0;
//     const cartonsDiff = newCartons - oldCartons;

//     // // 👉 Update main Product cartons (global sum for all users)
//     // product.cartons = (product.cartons || 0) + cartonsDiff;
//     // // Other fields update only if needed (rate, mrp etc, normally readonly in Edit form)
//     // if (req.body.pairPerCarton) product.pairPerCarton = Number(req.body.pairPerCarton);
//     // if (req.body.mrp) product.mrp = Number(req.body.mrp);
//     // if (req.body.rate) product.rate = parseFloat(Number(req.body.rate).toFixed(2));
//     // if (req.body.series) product.series = req.body.series.toUpperCase();
//     // await product.save();
// // Other fields update only if needed ...
// if (req.body.pairPerCarton) product.pairPerCarton = Number(req.body.pairPerCarton);
// if (req.body.mrp) product.mrp = Number(req.body.mrp);
// if (req.body.rate) product.rate = parseFloat(Number(req.body.rate).toFixed(2));
// if (req.body.series) product.series = req.body.series.toUpperCase();

// // Pehle SalaryEntry update karo (line remains above)
// // Uske baad product.cartons ka correct sum karo:
// const sumCartonsAgg = await SalaryEntry.aggregate([
//   { $match: { product: product._id } },
//   { $group: { _id: null, total: { $sum: "$cartons" } } }
// ]);
// product.cartons = sumCartonsAgg[0]?.total || 0;
// await product.save();

//     // 👉 Update or Create SalaryEntry for this user
//     if (userEntry) {
//       userEntry.cartons = newCartons;
//       userEntry.totalPairs = newCartons * product.pairPerCarton;
//       await userEntry.save();
//     } else {
//       userEntry = await SalaryEntry.create({
//         createdBy,
//         article: product.article,
//         gender: product.gender,
//         cartons: newCartons,
//         pairPerCarton: product.pairPerCarton,
//         totalPairs: newCartons * product.pairPerCarton,
//         product: id,
//       });
//     }

//     // 👉 Add History only if cartons changed
//     if (cartonsDiff !== 0) {
//       await History.create({
//         product: product._id,
//         action: 'UPDATE',
//         quantityChanged: cartonsDiff,
//         noOfCrtn: cartonsDiff,
//         pairPerCarton: product.pairPerCarton,
//         updatedBy: req.user?.id,
//         updatedByName: createdBy,   // always record the user updated
//         note: 'Product cartons updated',
//         timestamp: new Date(),
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Product updated successfully',
//       data: product,
//       totalCartons: product.cartons // helpful for frontend
//     });

//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };



// exports.getProductById = async (req, res) => {
//   try {
//     // Find product
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       return res.status(404).json({ success: false, error: 'Product not found' });
//     }

//     // Get 'createdBy' from query (or frontend/localStorage), always uppercase
//    // const currentUser = (req.query.createdBy || '').toUpperCase();
//    const currentUser = (req.query.createdBy || '').toUpperCase();


//     // Always standardize article/gender for matching!
//     const article = product.article.toUpperCase();
//     const gender = product.gender.toLowerCase();

//     // Debug logging for quick trace
//     console.log('getProductById', {
//       currentUser, article, gender, productId: product._id
//     });

    
//     let userEntry = null;
// if (currentUser) {
//   userEntry = await SalaryEntry.findOne({
//     createdBy: currentUser,
//     article: product.article.toUpperCase(),
//     gender: product.gender.toLowerCase(),
//     product: product._id,
//   }).sort({ createdAt: -1 });
// }

// const userCartons = userEntry ? userEntry.cartons : '';
// const userCreatedBy = userEntry ? userEntry.createdBy : (currentUser || 'UNKNOWN_USER');

// const agg = await SalaryEntry.aggregate([
//   { $match: { product: product._id } },
//   { $group: { _id: null, total: { $sum: "$cartons" } } }
// ]);
// const totalCartons = agg[0]?.total || 0;

// res.json({
//   success: true,
//   data: {
//     ...product.toObject(),
//     cartons: userCartons,     // Pre-fill */
//     createdBy: userCreatedBy, // Non editable for user */
//   },
//   totalCartons              // Sum of all users for display
// });
//   } catch (err) {
//     console.error('getProductById error:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };



// exports.getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

//     const currentUser = (req.query.createdBy || '').toUpperCase();

//     // User-specific cartons from SalaryEntry
//     let userCartons = '';
//     if (currentUser) {
//       const userEntry = await SalaryEntry.findOne({
//         createdBy: currentUser,
//         article: product.article.toUpperCase(),
//         gender: product.gender.toLowerCase(),
//         product: product._id,
//       }).sort({ createdAt: -1 });
//       userCartons = userEntry ? userEntry.cartons : '';
//     }

//     // Get createdBy from oldest ADD history
//     const firstHistory = await History.findOne({ product: product._id, action: 'ADD' }).sort({ timestamp: 1 });
//     const createdByName = firstHistory ? (firstHistory.updatedByName || firstHistory.updatedBy || 'UNKNOWN_USER') : 'UNKNOWN_USER';

//     // Get lastEditedBy filtered for currentUser only
//     let lastEditedBy = currentUser;
//     if (currentUser) {
//       const lastUserHistory = await History.findOne({
//         product: product._id,
//         updatedByName: currentUser
//       }).sort({ timestamp: -1 });
//       if (lastUserHistory) {
//         lastEditedBy = lastUserHistory.updatedByName || lastUserHistory.updatedBy || currentUser;
//       }
//     }

//     // Aggregate total cartons for all users
//     const agg = await SalaryEntry.aggregate([
//       { $match: { product: product._id } },
//       { $group: { _id: null, total: { $sum: "$cartons" } } }
//     ]);
//     const totalCartons = agg[0]?.total || 0;

//     res.json({
//   success: true,
//   data: {
//     ...product.toObject(),
//     cartons: userCartons,
//     createdBy: product.createdBy,   // ✅ asli product ka creator hamesha safe rahe
//     editingUser: currentUser || "", // ✅ jis user ka edit open hua wo alag bhej do
//     lastEditedBy,
//   },
//   totalCartons,
// });

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

    // 1. Total cartons for current user
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

    // 2. Find original creator
    const firstHistory = await History.findOne({
      product: product._id,
      action: 'ADD'
    }).sort({ timestamp: 1 });
    const originalCreator = firstHistory
      ? (firstHistory.updatedByName || firstHistory.updatedBy || 'UNKNOWN_USER')
      : product.createdBy || 'UNKNOWN_USER';

    // 3. Aggregate total cartons from all users
    const agg = await SalaryEntry.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, total: { $sum: "$cartons" } } }
    ]);
    const totalCartons = agg[0]?.total || 0;

    // 4. Send response
    res.json({
      success: true,
      data: {
        ...product.toObject(),
        cartons: userCartons,
        createdBy: currentUser,
        originalCreator: originalCreator
      },
      totalCartons,
    });
  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};



// ✅ FIXED updateProduct - Target specific user's salary
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = (req.body.createdBy || '').toUpperCase(); // User jiska edit ho raha hai
   // const newCartons = Number(req.body.cartons) || 0;
const increment = Number(req.body.cartons) || 0;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    // 1. Find TARGET USER's current SalaryEntry for the product
    let userEntry = await SalaryEntry.findOne({
      createdBy: targetUser, // ✅ FIXED: Target specific user
      article: product.article,
      gender: product.gender,
      product: id,
    }).sort({ createdAt: -1 });

    const oldCartons = userEntry?.cartons || 0;
   // const diff = newCartons - oldCartons;
const newCartons = oldCartons + increment;
const diff = increment;

    // 2. Update or create the SalaryEntry for TARGET USER only
    if (userEntry) {
      userEntry.cartons = newCartons;
      userEntry.totalPairs = newCartons * product.pairPerCarton;
      await userEntry.save();
    } else {
      // Create new entry for target user
      userEntry = await SalaryEntry.create({
        createdBy: targetUser,
        article: product.article,
        gender: product.gender,
       // cartons: newCartons,
        cartons: increment, 
        pairPerCarton: product.pairPerCarton,
        totalPairs: newCartons * product.pairPerCarton,
        product: id,
      });
    }

    // 3. Recalculate total cartons for product from all users
    const agg = await SalaryEntry.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, total: { $sum: "$cartons" } } }
    ]);
    product.cartons = agg[0]?.total || 0;
    await product.save();

    // 4. Add history record only if cartons changed
    if (diff !== 0) {
      await History.create({
        product: product._id,
        action: 'UPDATE',
       // oldValue: oldCartons,
        oldValue: oldCartons,
        newValue: newCartons,
       // quantityChanged: diff,
       quantityChanged: diff,
        updatedBy: req.user?.id,
        updatedByName: targetUser, // ✅ Target user ka naam
        note: `${targetUser} updated cartons from ${oldCartons} to ${newCartons}`,
        timestamp: new Date(),
        
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
      totalCartons: product.cartons,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};




// controllers/productController.js

exports.createProduct = async (req, res) => {
  console.log("Create Product Request Body:", req.body);
  try {
    const requiredFields = ['article', 'stockType', 'gender', 'createdBy', 'mrp', 'rate'];
    const missing = requiredFields.filter(field => !req.body[field]);
    if (missing.length) {
      return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(', ')}` });
    }

    // 1. Data ko number mein convert karo
    const productData = {
      article: (req.body.article || '').toUpperCase(),
      stockType: (req.body.stockType || '').toLowerCase(),
      gender: (req.body.gender || '').toLowerCase(),
      color: (req.body.color || '').toUpperCase(),
      size: req.body.size || '',
      pairPerCarton: Number(req.body.pairPerCarton) || 0,
      mrp: Number(req.body.mrp),
      rate: parseFloat(Number(req.body.rate).toFixed(2)),
      series: (req.body.series || '').toUpperCase(),
      cartons: Number(req.body.cartons) || 0,
      createdBy: (req.body.createdBy || '').toUpperCase(),
    };
    
    if (req.file) {
      productData.image = req.file.path;
    }

    const matchQuery = {
      article: productData.article,
      stockType: productData.stockType,
      gender: productData.gender,
      color: productData.color,
      size: productData.size,
    };

    // 2. Product ko find karo ya create karo
    let product = await Product.findOne(matchQuery);
    let isNewProduct = false;
    if (!product) {
      product = new Product(productData);
      await product.save();
      isNewProduct = true;
    }

    const cartonsToAdd = productData.cartons;

    // 3. ✅ FIX: SalaryEntry ko PEHLE banao
    const newSalaryEntry = await SalaryEntry.create({
      createdBy: productData.createdBy,
      article: productData.article,
      gender: productData.gender,
      cartons: cartonsToAdd,
      pairPerCarton: productData.pairPerCarton,
      totalPairs: cartonsToAdd * productData.pairPerCarton,
      product: product._id,
    });

    // 4. ✅ FIX: Ab History banao aur usme salaryEntryId daalo
    await History.create({
      product: product._id,
      action: isNewProduct ? 'ADD' : 'UPDATE',
      salaryEntryId: newSalaryEntry._id, // Ab yeh kaam karega
      quantityChanged: cartonsToAdd,
      updatedByName: productData.createdBy,
      note: isNewProduct ? 'New product created' : 'Added cartons to existing product',
      timestamp: new Date(),
    });

    // 5. Product ke total cartons ko recalculate karo
    const agg = await SalaryEntry.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, total: { $sum: "$cartons" } } }
    ]);
    const totalCartons = agg[0]?.total || 0;

    product.cartons = totalCartons;
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created/updated successfully',
      data: product,
    });
  } catch (err) {
    console.error("Create Product Error:", err); // Error ko log karo
    res.status(400).json({ success: false, error: err.message });
  }
};



// 4. Get Stock History (OPTIONAL: Now recommended to use separate History collection API)
exports.getStockHistory = async (req, res) => {
  // If you want to keep old embedded history aggregation, else create new HistoryController and route
  res.status(501).json({ success: false, error: 'Use new History API endpoint /api/history' });
};




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
    if (minCartons) filter.cartons = { $gte: Number(minCartons) };
    if (maxCartons) filter.cartons = { ...filter.cartons, $lte: Number(maxCartons) };

    const products = await Product.find(filter)
      .sort(sortOptions);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
// new 
 
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


