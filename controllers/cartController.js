const Cart     = require('../models/Cart');
const MenuItem = require('../models/MenuItem');

// ── POST /api/cart/add ────────────────────────────────────────────────────────
// @desc   Add an item to the cart; increment quantity if it already exists
// @access Private
exports.addToCart = async (req, res) => {
  try {
    const { menuItemId, quantity = 1 } = req.body;

    if (!menuItemId) {
      return res.status(400).json({ success: false, message: 'menuItemId is required.' });
    }

    // Validate quantity
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer.' });
    }

    // Confirm menu item exists
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    // Find or create the user's cart
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    // Check if the item is already in the cart
    const existingItem = cart.items.find(
      (item) => item.menuItemId.toString() === menuItemId
    );

    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      cart.items.push({ menuItemId, quantity: qty, price: menuItem.price });
    }

    cart.recalculateTotal();
    await cart.save();

    res.status(200).json({ success: true, message: 'Item added to cart.', data: cart });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid menu item ID.' });
    }
    console.error('addToCart error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ── GET /api/cart ─────────────────────────────────────────────────────────────
// @desc   Get the logged-in user's cart with populated item details
// @access Private
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate({
      path: 'items.menuItemId',
      select: 'name price category isAvailable shopId',
    });

    if (!cart) {
      return res.status(200).json({ success: true, data: { items: [], totalAmount: 0 } });
    }

    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    console.error('getCart error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ── DELETE /api/cart/item/:itemId ─────────────────────────────────────────────
// @desc   Remove a single item from the cart by its cart sub-document _id
// @access Private
exports.removeItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }

    cart.items.splice(itemIndex, 1);
    cart.recalculateTotal();
    await cart.save();

    res.status(200).json({ success: true, message: 'Item removed from cart.', data: cart });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid item ID.' });
    }
    console.error('removeItem error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ── DELETE /api/cart ──────────────────────────────────────────────────────────
// @desc   Clear the entire cart for the logged-in user
// @access Private
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    cart.items      = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(200).json({ success: true, message: 'Cart cleared.', data: cart });
  } catch (err) {
    console.error('clearCart error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};
