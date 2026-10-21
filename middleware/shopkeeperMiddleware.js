
const shopkeeperMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'shopkeeper') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only shopkeepers can perform this action.',
        });
    }

    next();
};

module.exports = shopkeeperMiddleware;
