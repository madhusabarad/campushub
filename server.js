require('dotenv').config();

const jwt = require('jsonwebtoken');
const Shop = require('./models/Shop');

const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const shopRoutes = require('./routes/shopRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const menuRoutes = require('./routes/menuRoutes');
const adminRoutes = require('./routes/adminRoutes');
const xeroxRoutes = require('./routes/xeroxRoutes');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Make Socket.io available to controllers
app.set('io', io);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);

// menuRoutes must come BEFORE shopRoutes
app.use('/api/shops/manage/menu', menuRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/xerox', xeroxRoutes);

// Root check
app.get('/', (req, res) =>
  res.json({ message: 'CampusHub API is running' })
);

// 404 handler
app.use((req, res, next) => {
  const error = new Error('Route not found');
  error.status = 404;
  next(error);
});

// Centralized error handler
app.use(errorHandler);

// Socket.io JWT authentication
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
});

// Authenticated socket connection
io.on('connection', (socket) => {
  const userId = socket.user.id;

  socket.join(`user:${userId}`);
if (socket.user.role === 'shopkeeper') {
  Shop.find({ shopkeeperId: userId })
    .select('_id')
    .then((shops) => {
      shops.forEach((shop) => {
        socket.join(`shop:${shop._id}`);
      });
    })
    .catch((err) => console.error('Shop room join error:', err));
}

  console.log(`Authenticated user connected: ${userId}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`
  );
});

module.exports = app;
