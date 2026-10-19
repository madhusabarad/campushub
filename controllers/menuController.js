
const Shop = require('../models/Shop');
const MenuItem = require('../models/MenuItem');

// Find the shop assigned to the logged-in shopkeeper
const getAssignedShop = async (userId) => {
    return Shop.findOne({ shopkeeperId: userId });
};

// POST /api/shops/manage/menu
// Create a menu item for the assigned shop
exports.createMenuItem = async (req, res) => {
    try {
        const { name, price, category } = req.body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'A valid item name is required.',
            });
        }

        if (
            price === undefined ||
            price === null ||
            price === '' ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a non-negative number.',
            });
        }

        if (
            category !== undefined &&
            typeof category !== 'string'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Category must be a string.',
            });
        }

        const shop = await getAssignedShop(req.user.id);

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'No shop is assigned to this shopkeeper.',
            });
        }

        const menuItem = await MenuItem.create({
            shopId: shop._id,
            name: name.trim(),
            price: Number(price),
            category: category?.trim() || '',
        });

        return res.status(201).json({
            success: true,
            message: 'Menu item created successfully.',
            data: menuItem,
        });
    } catch (err) {
        console.error('createMenuItem error:', err);

        return res.status(500).json({
            success: false,
            message: 'Server error.',
        });
    }
};

// PATCH /api/shops/manage/menu/:itemId
// Update an item belonging to the assigned shop
exports.updateMenuItem = async (req, res) => {
    try {
        const { name, price, category } = req.body;
        const allowedFields = ['name', 'price', 'category'];

        if (!allowedFields.some((field) =>
            Object.prototype.hasOwnProperty.call(req.body, field)
        )) {
            return res.status(400).json({
                success: false,
                message: 'Provide at least one field to update: name, price, or category.',
            });
        }

        if (
            Object.prototype.hasOwnProperty.call(req.body, 'name') &&
            (typeof name !== 'string' || !name.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: 'Name must be a non-empty string.',
            });
        }

        if (
            Object.prototype.hasOwnProperty.call(req.body, 'price') &&
            (
                price === null ||
                price === '' ||
                !Number.isFinite(Number(price)) ||
                Number(price) < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a non-negative number.',
            });
        }

        if (
            Object.prototype.hasOwnProperty.call(req.body, 'category') &&
            typeof category !== 'string'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Category must be a string.',
            });
        }

        const shop = await getAssignedShop(req.user.id);

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'No shop is assigned to this shopkeeper.',
            });
        }

        const updates = {};

        if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
            updates.name = name.trim();
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'price')) {
            updates.price = Number(price);
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'category')) {
            updates.category = category.trim();
        }

        const menuItem = await MenuItem.findOneAndUpdate(
            { _id: req.params.itemId, shopId: shop._id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found in your assigned shop.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Menu item updated successfully.',
            data: menuItem,
        });
    } catch (err) {
        if (err.name === 'CastError' || err.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid menu item ID.',
            });
        }

        console.error('updateMenuItem error:', err);

        return res.status(500).json({
            success: false,
            message: 'Server error.',
        });
    }
};

// DELETE /api/shops/manage/menu/:itemId
// Delete an item belonging to the assigned shop
exports.deleteMenuItem = async (req, res) => {
    try {
        const shop = await getAssignedShop(req.user.id);

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'No shop is assigned to this shopkeeper.',
            });
        }

        const menuItem = await MenuItem.findOneAndDelete({
            _id: req.params.itemId,
            shopId: shop._id,
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found in your assigned shop.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Menu item deleted successfully.',
        });
    } catch (err) {
        if (err.name === 'CastError' || err.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid menu item ID.',
            });
        }

        console.error('deleteMenuItem error:', err);

        return res.status(500).json({
            success: false,
            message: 'Server error.',
        });
    }
};

// PATCH /api/shops/manage/menu/:itemId/availability
// Change an item's availability
exports.updateMenuItemAvailability = async (req, res) => {
    try {
        const { isAvailable } = req.body;

        if (typeof isAvailable !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isAvailable must be true or false.',
            });
        }

        const shop = await getAssignedShop(req.user.id);

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'No shop is assigned to this shopkeeper.',
            });
        }

        const menuItem = await MenuItem.findOneAndUpdate(
            { _id: req.params.itemId, shopId: shop._id },
            { $set: { isAvailable } },
            { new: true, runValidators: true }
        );

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found in your assigned shop.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Menu item availability updated successfully.',
            data: menuItem,
        });
    } catch (err) {
        if (err.name === 'CastError' || err.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid menu item ID.',
            });
        }

        console.error('updateMenuItemAvailability error:', err);

        return res.status(500).json({
            success: false,
            message: 'Server error.',
        });
    }
};
