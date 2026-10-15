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
      enum: ['canteen', 'foodcourt', 'bakery'],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shop', shopSchema);
