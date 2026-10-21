
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const shopkeeperMiddleware = require('../middleware/shopkeeperMiddleware');

const {
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateMenuItemAvailability,
} = require('../controllers/menuController');

// All menu management routes require authentication and shopkeeper role
router.use(authMiddleware, shopkeeperMiddleware);

router.post('/', createMenuItem);
router.patch('/:itemId', updateMenuItem);
router.delete('/:itemId', deleteMenuItem);
router.patch('/:itemId/availability', updateMenuItemAvailability);

module.exports = router;
