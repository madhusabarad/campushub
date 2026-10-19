
const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const MenuItem = require('../models/MenuItem');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Validate and normalize pagination parameters.
const getPagination = (query) => {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined
    ? DEFAULT_LIMIT
    : Number(query.limit);

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

// @desc List shops with pagination, search, and filters
// @route GET /api/shops
// @access Public
exports.getShops = async (req, res) => {
  try {
    const pagination = getPagination(req.query);

    if (!pagination) {
      return res.status(400).json({
        success: false,
        message: 'page must be a positive integer and limit must be between 1 and 100.',
      });
    }

    const { page, limit, skip } = pagination;
    const filter = {};

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
        const escapedSearch = search.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );

        filter.name = {
          $regex: escapedSearch,
          $options: 'i',
        };
      }
    }

    if (req.query.category !== undefined) {
      const validCategories = ['canteen', 'foodcourt', 'bakery'];
      const category = String(req.query.category).toLowerCase();

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category. Use canteen, foodcourt, or bakery.',
        });
      }

      filter.category = category;
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
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
      Shop.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: shops.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
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

// @desc List menu items for a specific shop with pagination and filters
// @route GET /api/shops/:id/menu
// @access Public
exports.getShopMenu = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shop ID.',
      });
    }

    const pagination = getPagination(req.query);

    if (!pagination) {
      return res.status(400).json({
        success: false,
        message: 'page must be a positive integer and limit must be between 1 and 100.',
      });
    }

    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found.',
      });
    }

    const { page, limit, skip } = pagination;
    const filter = { shopId: shop._id };

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
        const escapedSearch = search.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );

        filter.name = {
          $regex: escapedSearch,
          $options: 'i',
        };
      }
    }

    if (req.query.category !== undefined) {
      if (
        typeof req.query.category !== 'string' ||
        !req.query.category.trim() ||
        req.query.category.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: 'category must be a non-empty string of at most 100 characters.',
        });
      }

      filter.category = {
        $regex: `^${req.query.category.trim().replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        )}$`,
        $options: 'i',
      };
    }

    if (req.query.isAvailable !== undefined) {
      if (!['true', 'false'].includes(req.query.isAvailable)) {
        return res.status(400).json({
          success: false,
          message: 'isAvailable must be true or false.',
        });
      }

      filter.isAvailable = req.query.isAvailable === 'true';
    }

    const [menuItems, total] = await Promise.all([
      MenuItem.find(filter)
        .sort({ category: 1, name: 1, _id: 1 })
        .skip(skip)
        .limit(limit),
      MenuItem.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      shop: shop.name,
      count: menuItems.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
      data: menuItems,
    });
  } catch (err) {
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
