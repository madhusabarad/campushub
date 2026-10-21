const Shop = require('../models/Shop');
const MenuItem = require('../models/MenuItem');

// @desc  List all shops
// @route GET /api/shops
// @access Public
exports.getShops = async (req, res) => {
  try {
    const shops = await Shop.find().sort({ createdAt: -1 });
    res.json({ success: true, count: shops.length, data: shops });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc  List menu items for a specific shop
// @route GET /api/shops/:id/menu
// @access Public
exports.getShopMenu = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const menuItems = await MenuItem.find({ shopId: req.params.id }).sort({ category: 1, name: 1 });
    res.json({ success: true, shop: shop.name, count: menuItems.length, data: menuItems });
  } catch (err) {
    // Handle invalid ObjectId format
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid shop ID' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
