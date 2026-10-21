
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

const {
    addToCart,
    getCart,
    updateCartItemQuantity,
    removeItem,
    clearCart,
} = require('../controllers/cartController');

router.use(authMiddleware);

router.post('/add', addToCart);
router.get('/', getCart);
router.patch('/item/:itemId', updateCartItemQuantity);
router.delete('/item/:itemId', removeItem);
router.delete('/', clearCart);

module.exports = router;
