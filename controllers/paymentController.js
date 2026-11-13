require('dotenv').config();

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay payment order
const createPayment = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    const paymentOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt: order.orderToken || String(order._id),
    });

    order.paymentMethod = 'razorpay';
    order.paymentStatus = 'pending';
    order.razorpayOrderId = paymentOrder.id;

    await order.save();

    return res.status(200).json({
      message: 'Payment order created',
      paymentOrder,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({
      message: 'Could not create payment order',
    });
  }
};

// Verify Razorpay payment
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: 'Missing payment verification details',
      });
    }

    const order = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
      userId: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(200).json({
        message: 'Payment already verified',
        order,
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      order.paymentStatus = 'failed';
      await order.save();

      return res.status(400).json({
        message: 'Invalid payment signature',
      });
    }

    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;

    await order.save();

    return res.status(200).json({
      message: 'Payment verified successfully',
      order,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({
      message: 'Payment verification failed',
    });
  }
};

module.exports = {
  createPayment,
  verifyPayment,
};