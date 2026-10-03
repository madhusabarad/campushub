require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');

const dashboardRoutes = require('./routes/dashboardRoutes');
const shopRoutes      = require('./routes/shopRoutes');
const cartRoutes      = require('./routes/cartRoutes');

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

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ message: 'CampusHub API is running' }));

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
