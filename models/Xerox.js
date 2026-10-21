
const mongoose = require('mongoose');

const xeroxSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    shopkeeper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Relative path to the privately stored PDF.
    documentUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // Verified by the backend after parsing the uploaded PDF.
    totalPages: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: 'PDF page count must be a positive integer.',
      },
    },

    printRange: {
      type: String,
      enum: ['full', 'selected-pages'],
      required: true,
      default: 'full',
    },

    startPage: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Start page must be a positive integer.',
      },
    },

    endPage: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: 'End page must be a positive integer.',
      },
    },

    colorMode: {
      type: String,
      enum: ['black-and-white', 'color'],
      required: true,
    },

    numberOfCopies: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Number of copies must be a positive integer.',
      },
    },

    paperSize: {
      type: String,
      enum: ['A4'],
      required: true,
      default: 'A4',
    },

    printSides: {
      type: String,
      enum: ['single-sided', 'double-sided'],
      required: true,
    },

    includeOHP: {
      type: Boolean,
      default: false,
    },

    estimatedPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: 'Estimated price must be finite.',
      },
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
        'cancelled',
      ],
      default: 'pending',
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ['upi', 'cash'],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Validate that the stored page selection matches the actual PDF.
xeroxSchema.pre('validate', function () {
  if (
    !Number.isSafeInteger(this.totalPages) ||
    !Number.isSafeInteger(this.startPage) ||
    !Number.isSafeInteger(this.endPage) ||
    this.totalPages < 1 ||
    this.startPage < 1 ||
    this.endPage < this.startPage ||
    this.endPage > this.totalPages
  ) {
    this.invalidate(
      'endPage',
      'The selected page range is invalid for this PDF.'
    );
    return;
  }

  if (
    this.printRange === 'full' &&
    (this.startPage !== 1 || this.endPage !== this.totalPages)
  ) {
    this.invalidate(
      'printRange',
      'A full PDF print must include every page.'
    );
  }

  if (
    this.printRange === 'selected-pages' &&
    this.startPage === 1 &&
    this.endPage === this.totalPages
  ) {
    this.invalidate(
      'printRange',
      'Choose full PDF printing when selecting every page.'
    );
  }
});

module.exports = mongoose.model('Xerox', xeroxSchema);
