require('dotenv').config();
<<<<<<< HEAD
const express  = require('express');
const mongoose = require('mongoose');

const dashboardRoutes = require('./routes/dashboardRoutes');
const shopRoutes      = require('./routes/shopRoutes');
const cartRoutes      = require('./routes/cartRoutes');
const orderRoutes     = require('./routes/orderRoutes');

const app = express();

// ── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Database Connection ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/shops',     shopRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/orders',    orderRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ message: 'CampusHub API is running' }));

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
=======
const express = require('express');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const healthRoutes = require('./routes/healthRoutes');
app.use('/api', healthRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
>>>>>>> dev
