const mongoose = require('mongoose');

// ── Sub-schema for order line items (snapshot at order time) ──────────────────
const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: [true, 'Menu item reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Item name snapshot is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price snapshot is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: true }
);

// ── Order schema ───────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop reference is required'],
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['placed', 'preparing', 'ready', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'placed',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // updatedAt is still useful for tracking status changes
    timestamps: { createdAt: false, updatedAt: true },
  }
);

module.exports = mongoose.model('Order', orderSchema);
