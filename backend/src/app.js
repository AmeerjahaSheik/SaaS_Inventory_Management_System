const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl || '*',
    credentials: true,
  })
);

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

