const Cart     = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Order    = require('../models/Order');

// ── POST /api/orders ──────────────────────────────────────────────────────────
// @desc   Create an order from the logged-in user's current cart, then clear it
// @access Private
exports.createOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Add items before placing an order.',
      });
    }

    // Resolve each cart item to its current MenuItem doc to get name + shopId
    // We need a consistent shopId — enforce single-shop carts here
    const menuItemIds = cart.items.map((i) => i.menuItemId);
    const menuItems   = await MenuItem.find({ _id: { $in: menuItemIds } });

    const menuItemMap = {};
    menuItems.forEach((mi) => { menuItemMap[mi._id.toString()] = mi; });

    // Validate all items still exist
    for (const cartItem of cart.items) {
      if (!menuItemMap[cartItem.menuItemId.toString()]) {
        return res.status(400).json({
          success: false,
          message: `Menu item ${cartItem.menuItemId} no longer exists.`,
        });
      }
    }

    // Determine shopId (use the first item's shop)
    const firstMenuItem = menuItemMap[cart.items[0].menuItemId.toString()];
    const shopId = firstMenuItem.shopId;

    // Build the order items snapshot
    const orderItems = cart.items.map((cartItem) => {
      const menuItem = menuItemMap[cartItem.menuItemId.toString()];
      return {
        menuItemId: cartItem.menuItemId,
        name:       menuItem.name,       // snapshot
        quantity:   cartItem.quantity,
        price:      cartItem.price,      // price locked at cart-add time
      };
    });

    // Create and save the order
    const order = await Order.create({
      userId:      req.user.id,
      shopId,
      items:       orderItems,
      totalAmount: cart.totalAmount,
    });

    // Clear the cart
    cart.items       = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: order,
    });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ── GET /api/orders ───────────────────────────────────────────────────────────
// @desc   Get all orders for the logged-in user, newest first
// @access Private
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('shopId', 'name category');

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    console.error('getUserOrders error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
// @desc   Get a single order by id (only if it belongs to the logged-in user)
// @access Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('shopId', 'name category');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Ownership check
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid order ID.' });
    }
    console.error('getOrderById error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ── PATCH /api/orders/:id/status ─────────────────────────────────────────────
// @desc   Update the status of an order (shopkeeper use — role restriction TBD)
// @access Private
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ['placed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${allowedStatuses.join(', ')}.`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to "${status}".`,
      data: order,
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid order ID.' });
    }
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};
