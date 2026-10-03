const express = require('express');
const router  = express.Router();

const authMiddleware             = require('../middleware/authMiddleware');
const { addToCart, getCart, removeItem, clearCart } = require('../controllers/cartController');

// All cart routes are protected
router.use(authMiddleware);

// POST   /api/cart/add           → add / increment item
router.post('/add', addToCart);

// GET    /api/cart               → get cart with populated details
router.get('/', getCart);

// DELETE /api/cart/item/:itemId  → remove one item (by sub-doc _id)
router.delete('/item/:itemId', removeItem);

// DELETE /api/cart               → clear entire cart
router.delete('/', clearCart);

module.exports = router;
