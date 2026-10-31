
const mongoose = require('mongoose');

const User = require('../models/User');
const Shop = require('../models/Shop');
const Order = require('../models/Order');

const { buildRevenuePerShop } = require('../utils/adminAnalytics');
const { moveShopkeeperToShop } = require('../utils/shopkeeperAssignment');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const USER_ROLES = ['student', 'faculty', 'shopkeeper', 'admin'];

const SHOP_CATEGORIES = ['canteen', 'foodcourt', 'bakery'];

const ORDER_STATUSES = [
    'placed',
    'preparing',
    'ready',
    'completed',
    'cancelled',
];

const getPagination = (query) => {
    const page = query.page === undefined ? 1 : Number(query.page);

    const limit =
        query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);

    if (
        !Number.isSafeInteger(page) ||
        page < 1 ||
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > MAX_LIMIT
    ) {
        return null;
    }

    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
        return null;
    }

    return { page, limit, skip };
};

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSearch = (query) => {
    if (query.search === undefined) {
        return { search: '' };
    }

    if (
        typeof query.search !== 'string' ||
        query.search.trim().length > 100
    ) {
        return {
            error: 'search must be a string of at most 100 characters.',
        };
    }

    return { search: query.search.trim() };
};

const getDateFilter = (query) => {
    const filter = {};

    if (query.from !== undefined) {
        if (
            typeof query.from !== 'string' ||
            !query.from.trim()
        ) {
            return { error: 'from must be a valid date.' };
        }

        const value = query.from.trim();
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return { error: 'from must be a valid date.' };
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [year, month, day] = value.split('-').map(Number);

            if (
                date.getUTCFullYear() !== year ||
                date.getUTCMonth() !== month - 1 ||
                date.getUTCDate() !== day
            ) {
                return { error: 'from must be a valid date.' };
            }

            date.setUTCHours(0, 0, 0, 0);
        }

        filter.$gte = date;
    }

    if (query.to !== undefined) {
        if (
            typeof query.to !== 'string' ||
            !query.to.trim()
        ) {
            return { error: 'to must be a valid date.' };
        }

        const value = query.to.trim();
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return { error: 'to must be a valid date.' };
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [year, month, day] = value.split('-').map(Number);

            if (
                date.getUTCFullYear() !== year ||
                date.getUTCMonth() !== month - 1 ||
                date.getUTCDate() !== day
            ) {
                return { error: 'to must be a valid date.' };
            }

            date.setUTCHours(23, 59, 59, 999);
        }

        filter.$lte = date;
    }

    if (
        filter.$gte &&
        filter.$lte &&
        filter.$gte > filter.$lte
    ) {
        return { error: 'from cannot be later than to.' };
    }

    return { filter };
};

const getPaginationMetadata = (page, limit, total) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
});

// @desc List all users with pagination, search, and role filter
// @route GET /api/admin/users
// @access Admin

const getAllUsers = async (req, res) => {
    try {
        const pagination = getPagination(req.query);

        if (!pagination) {
            return res.status(400).json({
                success: false,
                message: 'page must be a positive integer and limit must be between 1 and 100.',
            });
        }

        const { page, limit, skip } = pagination;

        const searchResult = getSearch(req.query);

        if (searchResult.error) {
            return res.status(400).json({
                success: false,
                message: searchResult.error,
            });
        }

        const filter = {};

        if (searchResult.search) {
            const regex = {
                $regex: escapeRegex(searchResult.search),
                $options: 'i',
            };

            filter.$or = [
                { name: regex },
                { email: regex },
                { collegeId: regex },
            ];
        }

        if (req.query.role !== undefined) {
            if (!USER_ROLES.includes(req.query.role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role.',
                });
            }

            filter.role = req.query.role;
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            User.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            count: users.length,
            pagination: getPaginationMetadata(page, limit, total),
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

// @desc List all shops with pagination, search, and filters
// @route GET /api/admin/shops
// @access Admin

const getAllShops = async (req, res) => {
    try {
        const pagination = getPagination(req.query);

        if (!pagination) {
            return res.status(400).json({
                success: false,
                message: 'page must be a positive integer and limit must be between 1 and 100.',
            });
        }

        const { page, limit, skip } = pagination;

        const searchResult = getSearch(req.query);

        if (searchResult.error) {
            return res.status(400).json({
                success: false,
                message: searchResult.error,
            });
        }

        const filter = {};

        if (searchResult.search) {
            filter.name = {
                $regex: escapeRegex(searchResult.search),
                $options: 'i',
            };
        }

        if (req.query.category !== undefined) {
            if (!SHOP_CATEGORIES.includes(req.query.category)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category. Use canteen, foodcourt, or bakery.',
                });
            }

            filter.category = req.query.category;
        }

        if (req.query.isOpen !== undefined) {
            if (!['true', 'false'].includes(req.query.isOpen)) {
                return res.status(400).json({
                    success: false,
                    message: 'isOpen must be true or false.',
                });
            }

            filter.isOpen = req.query.isOpen === 'true';
        }

        const [shops, total] = await Promise.all([
            Shop.find(filter)
                .populate('shopkeeperId', 'name email collegeId role')
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Shop.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            count: shops.length,
            pagination: getPaginationMetadata(page, limit, total),
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

        const updatedShop = await moveShopkeeperToShop({
            Shop,
            shop,
            shopkeeper,
        });

        return res.status(200).json({
            success: true,
            message: 'Shopkeeper assigned successfully.',
            data: updatedShop,
        });
    } catch (error) {
        console.error('Assign shopkeeper error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to assign shopkeeper.',
        });
    }
};

// @desc List all orders with pagination, search, and filters
// @route GET /api/admin/orders
// @access Admin

const getAllOrders = async (req, res) => {
    try {
        const pagination = getPagination(req.query);

        if (!pagination) {
            return res.status(400).json({
                success: false,
                message: 'page must be a positive integer and limit must be between 1 and 100.',
            });
        }

        const { page, limit, skip } = pagination;

        const searchResult = getSearch(req.query);

        if (searchResult.error) {
            return res.status(400).json({
                success: false,
                message: searchResult.error,
            });
        }

        const filter = {};

        if (req.query.status !== undefined) {
            if (!ORDER_STATUSES.includes(req.query.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order status.',
                });
            }

            filter.status = req.query.status;
        }

        const dateResult = getDateFilter(req.query);

        if (dateResult.error) {
            return res.status(400).json({
                success: false,
                message: dateResult.error,
            });
        }

        if (Object.keys(dateResult.filter).length > 0) {
            filter.createdAt = dateResult.filter;
        }

        if (searchResult.search) {
            const regex = {
                $regex: escapeRegex(searchResult.search),
                $options: 'i',
            };

            const matchingStudents = await User.find({
                role: 'student',
                $or: [
                    { name: regex },
                    { email: regex },
                    { collegeId: regex },
                ],
            }).select('_id').lean();

            const searchConditions = [
                {
                    userId: {
                        $in: matchingStudents.map((user) => user._id),
                    },
                },
            ];

            if (mongoose.isValidObjectId(searchResult.search)) {
                searchConditions.push({
                    _id: searchResult.search,
                });
            }

            filter.$or = searchConditions;
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('userId', 'name email collegeId role')
                .populate('shopId', 'name category isOpen')
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Order.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            count: orders.length,
            pagination: getPaginationMetadata(page, limit, total),
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

            Order.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: null,
                        totalOrderValue: { $sum: '$totalAmount' },
                    },
                },
            ]),

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
                        shopName: {
                            $ifNull: ['$shop.name', 'Unknown shop'],
                        },
                        revenue: 1,
                        orderCount: 1,
                    },
                },
                { $sort: { revenue: -1, shopName: 1 } },
            ]),

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
