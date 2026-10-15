const express = require('express');
const router  = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');

// All order routes are protected
router.use(authMiddleware);

// POST   /api/orders              → place order from current cart
router.post('/', createOrder);

// GET    /api/orders              → list all orders for the logged-in user
router.get('/', getUserOrders);

// GET    /api/orders/:id          → get a single order (ownership enforced)
router.get('/:id', getOrderById);

// PATCH  /api/orders/:id/status   → update order status (shopkeeper — no role guard yet)
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
