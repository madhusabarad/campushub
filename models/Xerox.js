const mongoose = require('mongoose');

const xeroxSchema = new mongoose.Schema({

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  shopkeeper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  documentUrl: {
    type: String,
    required: true,
    trim: true
  },

  colorMode: {
    type: String,
    enum: ['black-and-white', 'color'],
    required: true
  },

  numberOfCopies: {
    type: Number,
    required: true,
    min: 1
  },

  paperSize: {
    type: String,
    enum: ['A4', 'A3', 'A5'],
    required: true,
    default: 'A4'
  },

  printSides: {
    type: String,
    enum: ['single-sided', 'double-sided'],
    required: true
  },

  estimatedPrice: {
    type: Number,
    required: true,
    min: 0
  },

  status: {
    type: String,
    enum: [
      'pending',
      'accepted',
      'rejected',
      'printing',
      'ready-for-pickup',
      'completed',
      'cancelled'
    ],
    default: 'pending'
  },

  paymentMethod: {
    type: String,
    enum: ['upi', 'cash'],
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Xerox', xeroxSchema);