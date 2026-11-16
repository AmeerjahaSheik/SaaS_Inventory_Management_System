const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Build list of allowed origins from defaults and environment configuration
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://saa-s-inventory-management-system-0001.vercel.app',
  'https://saa-s-inventory-management-system-amber.vercel.app',
];

const envAllowedOrigins = env.clientUrls || [];
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow non-browser requests (no origin header: curl, mobile apps, server-to-server, Render health checks)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.trim().replace(/\/$/, '');

    // 2. Allow if explicitly specified in allowed list or if CLIENT_URL is '*'
    if (env.clientUrl === '*' || allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // 3. Allow all Vercel deployments (production, previews, branch deploys)
    if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // 4. Allow any localhost or 127.0.0.1 port
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // 5. Allow Render domains (*.onrender.com)
    if (/^https:\/\/[a-zA-Z0-9_-]+\.onrender\.com$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // Disallow unknown origin without throwing 500 error
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
};

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Homepage Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'StockFlow API is running successfully!',
    status: 'healthy',
  });
});

// Health Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'StockFlow backend is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API Root Routes
app.use('/api/v1', routes);
app.use('/api', routes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;

