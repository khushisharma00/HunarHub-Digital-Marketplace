const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const entrepreneurRoutes = require('./routes/entrepreneurRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const productRoutes = require('./routes/productRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
const allowedOrigin = process.env.CLIENT_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? true : allowedOrigin,
  credentials: true
}));

// JSON & URL-Encoded body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
const uploadsPath = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Static file serving for legacy/seed images
const legacyImagesPath = path.resolve(__dirname, '../static/images');
if (fs.existsSync(legacyImagesPath)) {
  app.use('/images', express.static(legacyImagesPath));
}

// Health Check Endpoint (Required by prompt)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'HunarHub API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/entrepreneurs', entrepreneurRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// SPA Static Build Serving & Fallback in Production
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    // Only fallback for non-API requests
    if (req.originalUrl.startsWith('/api') || req.originalUrl === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred'
  });
});

module.exports = app;
