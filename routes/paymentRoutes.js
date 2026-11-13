const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
  createPayment,
  verifyPayment,
} = require('../controllers/paymentController');

router.use(authMiddleware);

router.post('/create/:orderId', createPayment);
router.post('/verify', verifyPayment);

module.exports = router;