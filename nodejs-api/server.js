/**
 * Banelo Coffee POS - Node.js API Server
 *
 * This API server connects the Django website (Laptop B) to the PostgreSQL database (Laptop A)
 * Implements all required endpoints for inventory, recipes, sales, and waste management
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const productsRoutes = require('./routes/products');
const recipesRoutes = require('./routes/recipes');
const salesRoutes = require('./routes/sales');
const wasteRoutes = require('./routes/waste');
const auditRoutes = require('./routes/audit');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:8000', 'http://127.0.0.1:8000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Banelo API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/products', productsRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/waste-logs', wasteRoutes); // Alias for waste logs
app.use('/api/audit-logs', auditRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Banelo Coffee POS API',
    version: '1.0.0',
    description: 'API server for Banelo inventory and recipe management',
    endpoints: {
      health: 'GET /api/health',
      products: {
        list: 'GET /api/products',
        get: 'GET /api/products/:id',
        create: 'POST /api/products',
        update: 'PUT /api/products/:id',
        delete: 'DELETE /api/products/:id',
        transfer: 'POST /api/products/transfer',
        updateInventory: 'PUT /api/products/:id/inventory'
      },
      recipes: {
        list: 'GET /api/recipes',
        get: 'GET /api/recipes/:id',
        create: 'POST /api/recipes',
        update: 'PUT /api/recipes/:id',
        delete: 'DELETE /api/recipes/:id',
        ingredients: 'GET /api/recipes/:id/ingredients'
      },
      sales: {
        list: 'GET /api/sales',
        summary: 'GET /api/sales/summary'
      },
      waste: {
        list: 'GET /api/waste-logs',
        create: 'POST /api/waste'
      },
      audit: {
        list: 'GET /api/audit-logs',
        create: 'POST /api/audit-logs'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Banelo Coffee POS API Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || 'banelo_db'} @ ${process.env.DB_HOST || 'localhost'}`);
  console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log('='.repeat(60));
  console.log('\n📋 Available endpoints:');
  console.log('   GET  /                           - API documentation');
  console.log('   GET  /api/health                - Health check');
  console.log('   GET  /api/products              - List products');
  console.log('   POST /api/products/transfer     - Transfer inventory A→B');
  console.log('   GET  /api/recipes               - List recipes');
  console.log('   PUT  /api/recipes/:id           - Update recipe');
  console.log('   DELETE /api/recipes/:id         - Delete recipe');
  console.log('   POST /api/waste                 - Record waste');
  console.log('\n⏳ Waiting for requests...\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT signal received: closing HTTP server');
  process.exit(0);
});
