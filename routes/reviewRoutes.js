const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
  createReview,
  getShopReviews,
} = require('../controllers/reviewController');

// Submit a review
router.post('/', authMiddleware, createReview);

// Get reviews for a shop
router.get('/shop/:shopId', getShopReviews);

module.exports = router;5