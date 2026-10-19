
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const shopkeeperMiddleware = require('../middleware/shopkeeperMiddleware');

const {
  createOrder,
  getUserOrders,
  getOrderById,
  getIncomingOrders,
  updateOrderStatus,
} = require('../controllers/orderController');

// All order routes require authentication
router.use(authMiddleware);

// Student order routes
router.post('/', createOrder);
router.get('/', getUserOrders);

// Shopkeeper order routes — keep these before /:id
router.get('/shop/incoming', shopkeeperMiddleware, getIncomingOrders);

router.patch(
  '/:id/status',
  shopkeeperMiddleware,
  updateOrderStatus
);

// Get one of the logged-in student's own orders
router.get('/:id', getOrderById);

module.exports = router;
