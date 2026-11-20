const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['canteen', 'foodcourt', 'bakery', 'xerox'],
      required: [true, 'Shop category is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    shopkeeperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    upiId: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

shopSchema.index({ shopkeeperId: 1 });
shopSchema.index({ category: 1 });

module.exports = mongoose.model('Shop', shopSchema);
