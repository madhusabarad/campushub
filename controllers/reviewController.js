const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');

const MAX_COMMENT_LENGTH = 500;

// Submit a review for a completed order
exports.createReview = async (req, res) => {
  try {
    const { orderId, comment } = req.body;
    const rating = Number(req.body.rating);

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid order ID is required.',
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a whole number from 1 to 5.',
      });
    }

    if (comment !== undefined && comment !== null && typeof comment !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Comment must be text.',
      });
    }

    const cleanComment = (comment || '').trim();

    if (cleanComment.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Comment must be at most ${MAX_COMMENT_LENGTH} characters.`,
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
      comment: cleanComment,
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

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Review data is not valid.',
      });
    }

    console.error('createReview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit review.',
    });
  }
};

// Get reviews for a shop, with average rating and review count
exports.getShopReviews = async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!mongoose.isValidObjectId(shopId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid shop ID is required.',
      });
    }

    const shopObjectId = new mongoose.Types.ObjectId(shopId);

    const [reviews, stats] = await Promise.all([
      Review.find({ shopId: shopObjectId })
        .populate('userId', 'name')
        .sort({ createdAt: -1 }),
      Review.aggregate([
        { $match: { shopId: shopObjectId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const averageRating = stats.length
      ? Math.round(stats[0].averageRating * 10) / 10
      : 0;
    const reviewCount = stats.length ? stats[0].reviewCount : 0;

    return res.json({
      success: true,
      averageRating,
      reviewCount,
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
