
const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const shopkeeperMiddleware = require('../middleware/shopkeeperMiddleware');
const { uploadXeroxDocument } = require('../middleware/xeroxUploadMiddleware');

const {
    getPricing,
    createXeroxRequest,
    getMyXeroxRequests,
    getShopkeeperRequests,
    updateXeroxStatus,
    markXeroxPaymentPaid,
    downloadXeroxDocument,
} = require('../controllers/xeroxController');

const router = express.Router();

// All Xerox endpoints require authentication, except pricing.
router.get('/pricing', getPricing);

// Students create requests and view their own requests.
router.post(
    '/',
    authMiddleware,
    (req, res, next) => {
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can create Xerox requests.',
            });
        }

        next();
    },
    uploadXeroxDocument,
    createXeroxRequest
);

router.get('/my-requests', authMiddleware, (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Only students can view their own Xerox requests.',
        });
    }

    next();
}, getMyXeroxRequests);

// Shopkeepers can see unassigned pending requests and their own assigned ones.
router.get(
    '/shop/requests',
    authMiddleware,
    shopkeeperMiddleware,
    getShopkeeperRequests
);

// Shopkeepers update request statuses.
router.patch(
    '/:id/status',
    authMiddleware,
    shopkeeperMiddleware,
    updateXeroxStatus
);

// Assigned shopkeepers confirm payment after completing a request.
router.patch(
    '/:id/payment',
    authMiddleware,
    shopkeeperMiddleware,
    markXeroxPaymentPaid
);

// Students can access their own documents; assigned shopkeepers and admins
// are authorized in the controller.
router.get(
    '/:id/document',
    authMiddleware,
    downloadXeroxDocument
);

module.exports = router;
