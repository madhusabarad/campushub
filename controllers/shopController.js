
const Shop = require('../models/Shop');
const MenuItem = require('../models/MenuItem');

// @desc List all shops
// @route GET /api/shops
// @access Public
exports.getShops = async (req, res) => {
  try {
    const shops = await Shop.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: shops.length,
      data: shops,
    });
  } catch (err) {
    console.error('getShops error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

// @desc List menu items for a specific shop
// @route GET /api/shops/:id/menu
// @access Public
exports.getShopMenu = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found.',
      });
    }

    const menuItems = await MenuItem.find({
      shopId: req.params.id,
    }).sort({ category: 1, name: 1 });

    return res.json({
      success: true,
      shop: shop.name,
      count: menuItems.length,
      data: menuItems,
    });
  } catch (err) {
    if (err.name === 'CastError' || err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid shop ID.',
      });
    }

    console.error('getShopMenu error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

// @desc Open or close the assigned shop
// @route PATCH /api/shops/manage/status
// @access Shopkeeper
exports.updateShopStatus = async (req, res) => {
  try {
    const { isOpen } = req.body;

    if (typeof isOpen !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isOpen must be true or false.',
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

    shop.isOpen = isOpen;
    await shop.save();

    return res.status(200).json({
      success: true,
      message: `Shop ${isOpen ? 'opened' : 'closed'} successfully.`,
      data: {
        _id: shop._id,
        name: shop.name,
        isOpen: shop.isOpen,
      },
    });
  } catch (err) {
    console.error('updateShopStatus error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};
