
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
  cancelOrder,
} = require('../controllers/orderController');

router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getUserOrders);

// Shopkeeper-only order endpoints
router.get('/shop/incoming', shopkeeperMiddleware, getIncomingOrders);
router.patch('/:id/status', shopkeeperMiddleware, updateOrderStatus);

// Student cancellation; the controller checks the user's role and ownership.
router.patch('/:id/cancel', cancelOrder);

router.get('/:id', getOrderById);

module.exports = router;
