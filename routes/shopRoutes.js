const express = require('express');
const router = express.Router();
const { getShops, getShopMenu } = require('../controllers/shopController');

// GET /api/shops          → list all shops
router.get('/', getShops);

// GET /api/shops/:id/menu → list menu items for a shop
router.get('/:id/menu', getShopMenu);

module.exports = router;
