
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const shopkeeperMiddleware = require('../middleware/shopkeeperMiddleware');

const {
    getShops,
    getShopMenu,
    updateShopStatus,
} = require('../controllers/shopController');

// GET /api/shops - list all shops
router.get('/', getShops);

// PATCH /api/shops/manage/status - open or close assigned shop
router.patch(
    '/manage/status',
    authMiddleware,
    shopkeeperMiddleware,
    updateShopStatus
);

// GET /api/shops/:id/menu - list menu items for a shop
router.get('/:id/menu', getShopMenu);

module.exports = router;
