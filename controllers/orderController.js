
const mongoose = require('mongoose');

const Shop = require('../models/Shop');
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const User = require('../models/User');

const ORDER_STATUSES = [
  'placed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

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

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


const getDateFilter = (query) => {
  const filter = {};

  if (query.from !== undefined) {
    if (
      typeof query.from !== 'string' ||
      !query.from.trim()
    ) {
      return { error: 'from must be a valid date.' };
    }

    const fromValue = query.from.trim();
    const from = new Date(fromValue);

    if (Number.isNaN(from.getTime())) {
      return { error: 'from must be a valid date.' };
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(fromValue)) {
      const [year, month, day] = fromValue.split('-').map(Number);

      if (
        from.getUTCFullYear() !== year ||
        from.getUTCMonth() !== month - 1 ||
        from.getUTCDate() !== day
      ) {
        return { error: 'from must be a valid date.' };
      }

      from.setUTCHours(0, 0, 0, 0);
    }

    filter.$gte = from;
  }

  if (query.to !== undefined) {
    if (
      typeof query.to !== 'string' ||
      !query.to.trim()
    ) {
      return { error: 'to must be a valid date.' };
    }

    const toValue = query.to.trim();
    const to = new Date(toValue);

    if (Number.isNaN(to.getTime())) {
      return { error: 'to must be a valid date.' };
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(toValue)) {
      const [year, month, day] = toValue.split('-').map(Number);

      if (
        to.getUTCFullYear() !== year ||
        to.getUTCMonth() !== month - 1 ||
        to.getUTCDate() !== day
      ) {
        return { error: 'to must be a valid date.' };
      }

      to.setUTCHours(23, 59, 59, 999);
    }

    filter.$lte = to;
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


const validateStatus = (status) =>
  typeof status === 'string' && ORDER_STATUSES.includes(status);

// POST /api/orders
// Create an order from the logged-in student's cart.
exports.createOrder = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can place orders.',
      });
    }

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Add items before placing an order.',
      });
    }

    const menuItemIds = cart.items.map((item) => item.menuItemId);

    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
    });

    const menuItemMap = new Map(
      menuItems.map((item) => [item._id.toString(), item])
    );

    for (const cartItem of cart.items) {
      const menuItem = menuItemMap.get(
        cartItem.menuItemId.toString()
      );

      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message:
            'One or more menu items no longer exist. Please update your cart.',
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `"${menuItem.name}" is currently unavailable.`,
        });
      }

      if (
        !Number.isInteger(cartItem.quantity) ||
        cartItem.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: 'Your cart contains an invalid item quantity.',
        });
      }
    }

    const firstMenuItem = menuItemMap.get(
      cart.items[0].menuItemId.toString()
    );
    const shopId = firstMenuItem.shopId.toString();

    const containsDifferentShop = cart.items.some((cartItem) => {
      const menuItem = menuItemMap.get(
        cartItem.menuItemId.toString()
      );

      return menuItem.shopId.toString() !== shopId;
    });

    if (containsDifferentShop) {
      return res.status(400).json({
        success: false,
        message:
          'Your cart contains items from different shops. Please order from one shop at a time.',
      });
    }

    const shop = await Shop.findById(firstMenuItem.shopId);

    if (!shop) {
      return res.status(400).json({
        success: false,
        message: 'The shop associated with your cart no longer exists.',
      });
    }

    if (!shop.isOpen) {
      return res.status(400).json({
        success: false,
        message:
          'This shop is currently closed. You cannot place an order right now.',
      });
    }

    const orderItems = cart.items.map((cartItem) => {
      const menuItem = menuItemMap.get(
        cartItem.menuItemId.toString()
      );

      return {
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: cartItem.quantity,
        price: menuItem.price,
      };
    });

    const totalAmount = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    if (!Number.isFinite(totalAmount)) {
      return res.status(400).json({
        success: false,
        message:
          'Unable to calculate your order total. Please update your cart.',
      });
    }

    const order = await Order.create({
      userId: req.user.id,
      shopId: shop._id,
      items: orderItems,
      totalAmount,
    });

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: order,
    });
  } catch (err) {
    console.error('createOrder error:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error while placing your order.',
    });
  }
};

// GET /api/orders
// Get the logged-in student's orders with pagination and filters.
// Query parameters: page, limit, status, from, to.
exports.getUserOrders = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can access this order list.',
      });
    }

    const pagination = getPagination(req.query);

    if (!pagination) {
      return res.status(400).json({
        success: false,
        message:
          'page must be a positive integer and limit must be between 1 and 100.',
      });
    }

    const filter = { userId: req.user.id };

    if (req.query.status !== undefined) {
      if (!validateStatus(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status.',
          allowedStatuses: ORDER_STATUSES,
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

    const { page, limit, skip } = pagination;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate('shopId', 'name category'),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
      data: orders,
    });
  } catch (err) {
    console.error('getUserOrders error:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving your orders.',
    });
  }
};

// GET /api/orders/:id
// Get one order belonging to the logged-in student.
exports.getOrderById = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can access this endpoint.',
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('shopId', 'name category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error('getOrderById error:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving the order.',
    });
  }
};

// PATCH /api/orders/:id/status
// Shopkeepers can advance an order by one valid step.

// PATCH /api/orders/:id/status
// Shopkeepers can advance an order by one valid step.
exports.updateOrderStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    const { status } = req.body;

    if (typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid order status is required.',
      });
    }

    const allowedTransitions = {
      placed: 'preparing',
      preparing: 'ready',
      ready: 'completed',
    };

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const shop = await Shop.findById(order.shopId);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'The shop associated with this order was not found.',
      });
    }

    if (
      !shop.shopkeeperId ||
      shop.shopkeeperId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only update orders for your assigned shop.',
      });
    }

    const nextStatus = allowedTransitions[order.status];

    if (!nextStatus || status !== nextStatus) {
      return res.status(400).json({
        success: false,
        message: `This order cannot move from "${order.status}" to "${status}".`,
      });
    }

    // Update only if the status has not changed since it was read.
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        shopId: shop._id,
        status: order.status,
      },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(409).json({
        success: false,
        message: 'The order status changed. Refresh the order and try again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${status}".`,
      data: updatedOrder,
    });
  } catch (err) {
    console.error('updateOrderStatus error:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error while updating the order status.',
    });
  }
};

// PATCH /api/orders/:id/cancel
// Students may cancel only their own orders that are still placed.
exports.cancelOrder = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can cancel orders through this endpoint.',
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        status: 'placed',
      },
      { $set: { status: 'cancelled' } },
      { new: true, runValidators: true }
    );

    if (!order) {
      const existingOrder = await Order.findOne({
        _id: req.params.id,
        userId: req.user.id,
      }).select('status');

      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Only orders with status "placed" can be cancelled.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      data: order,
    });
  } catch (err) {
    console.error('cancelOrder error:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error while cancelling the order.',
    });
  }
};


// GET /api/orders/shop/incoming
// Get orders for the logged-in shopkeeper's assigned shop.
// Query parameters: page, limit, status, search, from, to.
exports.getIncomingOrders = async (req, res) => {
  try {
    const pagination = getPagination(req.query);

    if (!pagination) {
      return res.status(400).json({
        success: false,
        message:
          'page must be a positive integer and limit must be between 1 and 100.',
      });
    }

    const shop = await Shop.findOne({
      shopkeeperId: req.user.id,
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'No shop is assigned to this shopkeeper.',
      });
    }

    const filter = { shopId: shop._id };

    if (req.query.status !== undefined) {
      if (!validateStatus(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status.',
          allowedStatuses: ORDER_STATUSES,
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

    if (req.query.search !== undefined) {
      if (
        typeof req.query.search !== 'string' ||
        req.query.search.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: 'search must be a string of at most 100 characters.',
        });
      }

      const search = req.query.search.trim();

      if (search) {
        const escapedSearch = escapeRegex(search);
        const matchingUsers = await User.find({
          $or: [
            { name: { $regex: escapedSearch, $options: 'i' } },
            { email: { $regex: escapedSearch, $options: 'i' } },
          ],
        }).select('_id');

        const matchingUserIds = matchingUsers.map((user) => user._id);

        const searchConditions = [
          { userId: { $in: matchingUserIds } },
        ];

        if (mongoose.isValidObjectId(search)) {
          searchConditions.push({
            _id: new mongoose.Types.ObjectId(search),
          });
        }

        filter.$or = searchConditions;
      }
    }

    const { page, limit, skip } = pagination;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .populate('shopId', 'name category'),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      shop: shop.name,
      count: orders.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
      data: orders,
    });
  } catch (err) {
    console.error('getIncomingOrders error:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving incoming orders.',
    });
  }
};
