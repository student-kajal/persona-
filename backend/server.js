// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');

// // Custom utilities & middleware
// const connectDB = require('./config/db');
// const { notFound, errorHandler } = require('./middlewares/error');

// // Route imports
// const authRoutes = require('./routes/auth');
// const productRoutes = require('./routes/products');
// const challanRoutes = require('./routes/challans');
// const categoryRoutes = require('./routes/categoryRoutes');
// const reportRoutes = require('./routes/reportRoutes');
// const salarySettingRoutes = require('./routes/salarySettingRoutes');
// const pdfRoutes = require('./routes/pdfRoutes');

// // ✅ New Challan route imports
// const challanApiRoutes = require('./routes/challanRoutes');
// const challanPdfRoutes = require('./routes/challanPdfRoutes');

// // Initialize express app
// const app = express();

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Serve static folder for uploaded images
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/challans', challanRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/salary-settings', salarySettingRoutes);
// app.use('/api/pdf', pdfRoutes);

// // ✅ New Challan API Routes
// app.use('/api/challans', challanApiRoutes);

// // ✅ New Challan PDF Routes 
// app.use('/api/challan-pdf', challanPdfRoutes);

// // Error Handling
// app.use(notFound);
// app.use(errorHandler);

// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// server.js (सही संस्करण)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Custom utilities & middleware
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/error');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categoryRoutes');
//const reportRoutes = require('./routes/reportRoutes');
//const salarySettingRoutes = require('./routes/salarySettingRoutes');
//const productionReportRoutes = require('./routes/productionReportRoutes');
// Add this near other route imports
//const productionReportRoutes = require('./routes/productionReportRoutes');

// Add this with other middleware


const salaryRoutes = require('./routes/salaryRoutes');
const pdfRoutes = require('./routes/pdfRoutes');

// ✅ Challan routes (एक ही file से import करें)
const challanRoutes = require('./routes/challanRoutes');
const challanPdfRoutes = require('./routes/challanPdfRoutes');

// ✅ Upload route import
const uploadRoutes = require('./routes/uploadRoutes');
const historyRoutes = require('./routes/history');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Static files serve करने के लिए
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
//app.use('/api/reports', reportRoutes);
//app.use('/api/salary-settings', salarySettingRoutes);
//app.use('/api', productionReportRoutes);
//app.use('/api/production', productionReportRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/pdf', pdfRoutes);

// ✅ Challan related routes (एक ही endpoint के अंदर)
app.use('/api/challans', challanRoutes);       // CRUD operations
app.use('/api/challan-pdf', challanPdfRoutes); // PDF generation

// ✅ Upload Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/history', historyRoutes);
// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
