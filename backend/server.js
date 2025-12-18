
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
// const categoryRoutes = require('./routes/categoryRoutes');

// // Add this with other middleware


// const salaryRoutes = require('./routes/salaryRoutes');
// const pdfRoutes = require('./routes/pdfRoutes');

// // ✅ Challan routes (एक ही file से import करें)
// const challanRoutes = require('./routes/challanRoutes');
// const challanPdfRoutes = require('./routes/challanPdfRoutes');

// // ✅ Upload route import
// const uploadRoutes = require('./routes/uploadRoutes');
// //const historyRoutes = require('./routes/history');

// // Initialize express app
// const app = express();


// // Connect to MongoDB
// connectDB();

// // Middleware
// //app.use(cors());
// app.use(cors({
//   origin: [
//     'https://persona-pfqu.vercel.app',      // Vercel domain
//     'https://persona-6y7t.vercel.app',     // Netlify domain  
//     'https://your-netlify-domain.netlify.app',  // Agar aur domains hon
//     'http://localhost:3000'                // Local development
//   ],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
//   credentials: true
// }));

// // Preflight requests ke liye
// //app.options('/*', cors());

// app.use(express.json());

// // ✅ Static files serve करने के लिए
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/categories', categoryRoutes);
// //app.use('/api/reports', reportRoutes);
// //app.use('/api/salary-settings', salarySettingRoutes);
// //app.use('/api', productionReportRoutes);
// //app.use('/api/production', productionReportRoutes);
// app.use('/api/salary', salaryRoutes);
// app.use('/api/pdf', pdfRoutes);

// // ✅ Challan related routes (एक ही endpoint के अंदर)
// app.use('/api/challans', challanRoutes);       // CRUD operations
// app.use('/api/challan-pdf', challanPdfRoutes); // PDF generation

// // ✅ Upload Routes
// app.use('/api/upload', uploadRoutes);
// const historyRoutes = require('./routes/history.routes');

// app.use('/api/history', historyRoutes);
// // Error Handling
// app.use(notFound);
// app.use(errorHandler);

// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
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

const salaryRoutes = require('./routes/salaryRoutes');
const pdfRoutes = require('./routes/pdfRoutes');

// ✅ Challan routes
const challanRoutes = require('./routes/challanRoutes');
const challanPdfRoutes = require('./routes/challanPdfRoutes');

// ✅ Upload route import
const uploadRoutes = require('./routes/uploadRoutes');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// ✅ CORS Configuration (FIXED)
app.use(cors({
  origin: [
    'https://dazzling-pika-056e2c.netlify.app',  // ← Your actual Netlify domain
    'https://persona-pfqu.vercel.app',           // ← Vercel domain (if needed)
     'https://persona-3.onrender.com',
    'http://localhost:3000'                      // ← Local development
  ],
//  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
}));
   
app.use(express.json());

// ✅ Static files serve करने के लिए
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/pdf', pdfRoutes);

// ✅ Challan related routes
app.use('/api/challans', challanRoutes);
app.use('/api/challan-pdf', challanPdfRoutes);

// ✅ Upload Routes
app.use('/api/upload', uploadRoutes);
const historyRoutes = require('./routes/history.routes');

app.use('/api/history', historyRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
