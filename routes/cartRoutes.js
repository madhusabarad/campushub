
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

const studentMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Student role required.',
        });
    }

    next();
};

router.use(authMiddleware, studentMiddleware);

router.post('/add', addToCart);
router.get('/', getCart);
router.patch('/item/:itemId', updateCartItemQuantity);
router.delete('/item/:itemId', removeItem);
router.delete('/', clearCart);

module.exports = router;
