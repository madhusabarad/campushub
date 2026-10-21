const mongoose = require('mongoose');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const { buildRevenuePerShop } = require('../utils/adminAnalytics');

// @desc List all users
// @route GET /api/admin/users
// @access Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve users.',
        });
    }
};

// @desc List all shops and their assigned shopkeepers
// @route GET /api/admin/shops
// @access Admin
const getAllShops = async (req, res) => {
    try {
        const shops = await Shop.find()
            .populate('shopkeeperId', 'name email collegeId role')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: shops.length,
            data: shops,
        });
    } catch (error) {
        console.error('Get all shops error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve shops.',
        });
    }
};

// @desc Assign a shopkeeper to a shop
// @route PATCH /api/admin/shops/:shopId/assign-shopkeeper
// @access Admin
const assignShopkeeper = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { shopkeeperId } = req.body;

        if (
            !mongoose.isValidObjectId(shopId) ||
            !mongoose.isValidObjectId(shopkeeperId)
        ) {
            return res.status(400).json({
                success: false,
                message: 'A valid shop ID and shopkeeper ID are required.',
            });
        }

        const [shop, shopkeeper] = await Promise.all([
            Shop.findById(shopId),
            User.findById(shopkeeperId).select('name email role'),
        ]);

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found.',
            });
        }

        if (!shopkeeper) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        if (shopkeeper.role !== 'shopkeeper') {
            return res.status(400).json({
                success: false,
                message: 'The selected user is not a shopkeeper.',
            });
        }

        shop.shopkeeperId = shopkeeper._id;
        await shop.save();

        await shop.populate('shopkeeperId', 'name email collegeId role');

        return res.status(200).json({
            success: true,
            message: 'Shopkeeper assigned successfully.',
            data: shop,
        });
    } catch (error) {
        console.error('Assign shopkeeper error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to assign shopkeeper.',
        });
    }
};

// @desc List all orders
// @route GET /api/admin/orders
// @access Admin
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name email collegeId role')
            .populate('shopId', 'name category isOpen')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve orders.',
        });
    }
};

// @desc Get admin dashboard statistics and sales analytics
// @route GET /api/admin/stats
// @access Admin
const getAdminStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalStudents,
            totalShopkeepers,
            totalShops,
            openShops,
            totalOrders,
            placedOrders,
            preparingOrders,
            readyOrders,
            completedOrders,
            cancelledOrders,
            orderTotals,
            revenuePerShop,
            popularItems,
            dailyOrders,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'shopkeeper' }),
            Shop.countDocuments(),
            Shop.countDocuments({ isOpen: true }),
            Order.countDocuments(),
            Order.countDocuments({ status: 'placed' }),
            Order.countDocuments({ status: 'preparing' }),
            Order.countDocuments({ status: 'ready' }),
            Order.countDocuments({ status: 'completed' }),
            Order.countDocuments({ status: 'cancelled' }),

            // Exclude cancelled orders from order value.
            Order.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: null,
                        totalOrderValue: { $sum: '$totalAmount' },
                    },
                },
            ]),

            // Revenue per shop, including shops with no qualifying orders.
            Order.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: '$shopId',
                        revenue: { $sum: '$totalAmount' },
                        orderCount: { $sum: 1 },
                    },
                },
                {
                    $lookup: {
                        from: Shop.collection.name,
                        localField: '_id',
                        foreignField: '_id',
                        as: 'shop',
                    },
                },
                {
                    $unwind: {
                        path: '$shop',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        shopId: '$_id',
                        shopName: { $ifNull: ['$shop.name', 'Unknown shop'] },
                        revenue: 1,
                        orderCount: 1,
                    },
                },
                { $sort: { revenue: -1, shopName: 1 } },
            ]),

            // Rank items by total quantity ordered.
            Order.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: {
                            menuItemId: '$items.menuItemId',
                            name: '$items.name',
                        },
                        quantitySold: { $sum: '$items.quantity' },
                        revenue: {
                            $sum: {
                                $multiply: [
                                    '$items.price',
                                    '$items.quantity',
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        menuItemId: '$_id.menuItemId',
                        name: '$_id.name',
                        quantitySold: 1,
                        revenue: 1,
                    },
                },
                { $sort: { quantitySold: -1, name: 1 } },
                { $limit: 10 },
            ]),

            // Count orders per calendar day (UTC).
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $type: 'date' },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt',
                                timezone: 'UTC',
                            },
                        },
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: '$_id',
                        count: 1,
                    },
                },
                { $sort: { date: 1 } },
            ]),
        ]);

        // Include every shop, even if it has no non-cancelled orders.
        const shops = await Shop.find()
            .select('_id name')
            .lean();

        const completeRevenuePerShop = buildRevenuePerShop(
            shops,
            revenuePerShop
        );

        return res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    students: totalStudents,
                    shopkeepers: totalShopkeepers,
                },
                shops: {
                    total: totalShops,
                    open: openShops,
                    closed: totalShops - openShops,
                },
                orders: {
                    total: totalOrders,
                    placed: placedOrders,
                    preparing: preparingOrders,
                    ready: readyOrders,
                    completed: completedOrders,
                    cancelled: cancelledOrders,
                },
                totalOrderValue: orderTotals[0]?.totalOrderValue || 0,
                revenuePerShop: completeRevenuePerShop,
                popularItems,
                dailyOrders,
            },
        });
    } catch (error) {
        console.error('Get admin statistics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve admin statistics.',
        });
    }
};

module.exports = {
    getAllUsers,
    getAllShops,
    assignShopkeeper,
    getAllOrders,
    getAdminStats,
};
