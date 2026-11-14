const Review = require('../models/Review');
const Order = require('../models/Order');

// Submit a review for a completed order
exports.createReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Valid order ID and rating (1-5) are required.',
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.id,
      status: 'completed',
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Completed order not found.',
      });
    }

    const review = await Review.create({
      userId: req.user.id,
      shopId: order.shopId,
      orderId: order._id,
      rating,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this order.',
      });
    }

    console.error('createReview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit review.',
    });
  }
};

// Get reviews for a shop
exports.getShopReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      shopId: req.params.shopId,
    }).populate('userId', 'name');

    return res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error('getShopReviews error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews.',
    });
  }
};