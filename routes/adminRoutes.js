
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const {
    getAllUsers,
    getAllShops,
    assignShopkeeper,
    getAllOrders,
    getAdminStats,
} = require('../controllers/adminController');

// All admin routes require authentication and admin privileges.
router.use(authMiddleware, adminMiddleware);

// Admin dashboard statistics
router.get('/stats', getAdminStats);

// User management
router.get('/users', getAllUsers);

// Shop management
router.get('/shops', getAllShops);

// Assign shopkeeper
router.patch('/shops/:shopId/assign-shopkeeper', assignShopkeeper);

// Order management
router.get('/orders', getAllOrders);

module.exports = router;
