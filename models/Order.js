
const mongoose = require('mongoose');
const crypto = require('crypto');

// Order item snapshot
const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

// Order status history
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['placed', 'preparing', 'ready', 'completed', 'cancelled'],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: arr => arr.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Order tokens
    orderToken: {
      type: String,
      unique: true,
      sparse: true,
      immutable: true,
      default: () => `CH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    },
    pickupToken: {
      type: String,
      unique: true,
      sparse: true,
      immutable: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },

    // Payment details
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'pay_at_counter'],
      default: 'pay_at_counter',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ['placed', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'placed',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: undefined,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

// Add initial status to new orders
orderSchema.pre('validate', function (next) {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{
      status: this.status || 'placed',
      changedAt: new Date(),
      note: 'Order created',
    }];
  }

  next();
});

module.exports = mongoose.model('Order', orderSchema);
