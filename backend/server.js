require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const cookieParser = require('cookie-parser');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const connectDB              = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/error');
const authRoutes             = require('./routes/auth');
const productRoutes          = require('./routes/products');
const categoryRoutes         = require('./routes/categoryRoutes');
const salaryRoutes           = require('./routes/salaryRoutes');
const pdfRoutes              = require('./routes/pdfRoutes');
const challanRoutes          = require('./routes/challanRoutes');
const challanPdfRoutes       = require('./routes/challanPdfRoutes');
const uploadRoutes           = require('./routes/uploadRoutes');
const historyRoutes          = require('./routes/history.routes');

// ── Validate required env vars at startup ────────────────────────────────────
['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGO_URI'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`FATAL: missing env var ${key}`);
    process.exit(1);
  }
});

const app = express();

connectDB();

// Trust Render / Heroku proxy so req.ip is the real client IP for rate limiting
app.set('trust proxy', 1);

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── Request logging ──────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://dazzling-pika-056e2c.netlify.app',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                     // Postman / mobile
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (/\.netlify\.app$/.test(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// ── Rate limiters ─────────────────────────────────────────────────────────────
// Strict on login/register; lenient on refresh (needed by the auto-refresh timer)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many refresh requests. Slow down.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many register attempts. Try again later.' },
});

// Apply limiters before the auth router mounts its handlers
app.use('/api/auth/login',    loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/refresh',  refreshLimiter);

// ── Static files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/products',    productRoutes);
app.use('/api/categories',  categoryRoutes);
app.use('/api/salary',      salaryRoutes);
app.use('/api/pdf',         pdfRoutes);
app.use('/api/challans',    challanRoutes);
app.use('/api/challan-pdf', challanPdfRoutes);
app.use('/api/upload',      uploadRoutes);
app.use('/api/history',     historyRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
