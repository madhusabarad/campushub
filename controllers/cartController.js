
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');

exports.addToCart = async (req, res) => {
  try {
    const { menuItemId, quantity = 1 } = req.body;

    if (!menuItemId) {
      return res.status(400).json({
        success: false,
        message: 'menuItemId is required.',
      });
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer.',
      });
    }

    const menuItem = await MenuItem.findById(menuItemId);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    if (!menuItem.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This menu item is currently unavailable.',
      });
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.menuItemId.toString() === menuItemId
    );

    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      cart.items.push({
        menuItemId,
        quantity: qty,
        price: menuItem.price,
      });
    }

    cart.recalculateTotal();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item added to cart.',
      data: cart,
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item ID.',
      });
    }

    console.error('addToCart error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate({
      path: 'items.menuItemId',
      select: 'name price category isAvailable shopId',
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { items: [], totalAmount: 0 },
      });
    }

    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    console.error('getCart error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

exports.updateCartItemQuantity = async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer.',
      });
    }

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found.',
      });
    }

    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart.',
      });
    }

    item.quantity = quantity;
    cart.recalculateTotal();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart quantity updated.',
      data: cart,
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID.',
      });
    }

    console.error('updateCartItemQuantity error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found.',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart.',
      });
    }

    cart.items.splice(itemIndex, 1);
    cart.recalculateTotal();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart.',
      data: cart,
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID.',
      });
    }

    console.error('removeItem error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart is already empty.',
        data: { items: [], totalAmount: 0 },
      });
    }

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared.',
      data: cart,
    });
  } catch (err) {
    console.error('clearCart error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};
