const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Shop = require('../models/Shop');
const Order = require('../models/Order');
const {
  submitPaymentProof,
  updateOrderPayment,
} = require('../controllers/orderController');
const {
  updateShopUpi,
} = require('../controllers/shopController');
const {
  uploadDirectory,
  fileFilter,
} = require('../middleware/paymentUploadMiddleware');

test('Manual UPI Payment - Models Schema Validation', async (t) => {
  await t.test('Shop schema includes upiId field', () => {
    const upiIdPath = Shop.schema.path('upiId');
    assert.ok(upiIdPath, 'upiId path should exist on Shop schema');
    assert.equal(upiIdPath.instance, 'String');
  });

  await t.test('Order schema includes paymentMethod with enum and default', () => {
    const pmPath = Order.schema.path('paymentMethod');
    assert.ok(pmPath, 'paymentMethod path should exist on Order schema');
    assert.equal(pmPath.instance, 'String');
    assert.equal(pmPath.defaultValue, 'counter');
    assert.ok(pmPath.enumValues.includes('upi'));
    assert.ok(pmPath.enumValues.includes('counter'));
  });

  await t.test('Order schema includes paymentStatus with enum and default', () => {
    const psPath = Order.schema.path('paymentStatus');
    assert.ok(psPath, 'paymentStatus path should exist on Order schema');
    assert.equal(psPath.instance, 'String');
    assert.equal(psPath.defaultValue, 'unpaid');
    for (const val of [
      'unpaid',
      'pending_verification',
      'paid',
      'rejected',
    ]) {
      assert.ok(psPath.enumValues.includes(val));
    }
  });

  await t.test('Order schema includes paymentUtr with unique and sparse', () => {
    const utrPath = Order.schema.path('paymentUtr');
    assert.ok(utrPath, 'paymentUtr path should exist on Order schema');
    assert.equal(utrPath.instance, 'String');
    assert.equal(utrPath.options.unique, true);
    assert.equal(utrPath.options.sparse, true);
  });

  await t.test('Order schema includes paymentProof and paymentRejectReason', () => {
    const proofPath = Order.schema.path('paymentProof');
    assert.ok(proofPath, 'paymentProof path should exist on Order schema');
    assert.equal(proofPath.instance, 'String');

    const reasonPath = Order.schema.path('paymentRejectReason');
    assert.ok(reasonPath, 'paymentRejectReason path should exist on Order schema');
    assert.equal(reasonPath.instance, 'String');
  });
});

test('Manual UPI Payment - submitPaymentProof Controller Logic', async (t) => {
  const createMockRes = () => {
    const res = {
      statusCode: null,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  await t.test('Rejects non-student users with 403', async () => {
    const req = {
      user: { id: 'user-1', role: 'shopkeeper' },
      params: { id: new mongoose.Types.ObjectId().toString() },
    };
    const res = createMockRes();

    await submitPaymentProof(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonData.success, false);
  });

  await t.test('Rejects invalid order ID with 400', async () => {
    const req = {
      user: { id: 'user-1', role: 'student' },
      params: { id: 'invalid-id' },
    };
    const res = createMockRes();

    await submitPaymentProof(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonData.success, false);
    assert.equal(res.jsonData.message, 'Invalid order ID.');
  });

  await t.test('Rejects missing screenshot with 400', async () => {
    const orderId = new mongoose.Types.ObjectId();
    const originalFindById = Order.findById;
    Order.findById = async () => ({
      _id: orderId,
      userId: { toString: () => 'user-1' },
    });

    try {
      const req = {
        user: { id: 'user-1', role: 'student' },
        params: { id: orderId.toString() },
        file: null,
        body: { utr: '123456789012' },
      };
      const res = createMockRes();

      await submitPaymentProof(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonData.success, false);
      assert.equal(res.jsonData.message, 'Payment screenshot is required.');
    } finally {
      Order.findById = originalFindById;
    }
  });

  await t.test('Rejects non-12-digit UTR with 400', async () => {
    const orderId = new mongoose.Types.ObjectId();
    const originalFindById = Order.findById;
    Order.findById = async () => ({
      _id: orderId,
      userId: { toString: () => 'user-1' },
    });

    try {
      const invalidUtrs = ['123', '12345678901', '1234567890123', '12345678901a', ''];
      for (const utr of invalidUtrs) {
        const req = {
          user: { id: 'user-1', role: 'student' },
          params: { id: orderId.toString() },
          file: { filename: 'test.jpg' },
          body: { utr },
        };
        const res = createMockRes();

        await submitPaymentProof(req, res);

        assert.equal(res.statusCode, 400, `Expected 400 for UTR: "${utr}"`);
        assert.equal(res.jsonData.message, 'UTR must be exactly 12 digits.');
      }
    } finally {
      Order.findById = originalFindById;
    }
  });

  await t.test('Returns 409 "This UTR was already used" when duplicate UTR exists', async () => {
    const orderId = new mongoose.Types.ObjectId();
    const originalFindById = Order.findById;
    const originalFindOne = Order.findOne;

    Order.findById = async () => ({
      _id: orderId,
      userId: { toString: () => 'user-1' },
    });
    Order.findOne = async (query) => {
      if (query.paymentUtr === '123456789012') {
        return { _id: new mongoose.Types.ObjectId() };
      }
      return null;
    };

    try {
      const req = {
        user: { id: 'user-1', role: 'student' },
        params: { id: orderId.toString() },
        file: { filename: 'test.png' },
        body: { utr: '123456789012' },
      };
      const res = createMockRes();

      await submitPaymentProof(req, res);

      assert.equal(res.statusCode, 409);
      assert.equal(res.jsonData.success, false);
      assert.equal(res.jsonData.message, 'This UTR was already used');
    } finally {
      Order.findById = originalFindById;
      Order.findOne = originalFindOne;
    }
  });

  await t.test('Successfully updates order with UPI payment proof', async () => {
    const orderId = new mongoose.Types.ObjectId();
    const mockOrder = {
      _id: orderId,
      userId: { toString: () => 'user-1' },
      paymentMethod: 'counter',
      paymentStatus: 'unpaid',
      saved: false,
      async save() {
        this.saved = true;
      },
    };

    const originalFindById = Order.findById;
    const originalFindOne = Order.findOne;

    Order.findById = async () => mockOrder;
    Order.findOne = async () => null;

    try {
      const req = {
        user: { id: 'user-1', role: 'student' },
        params: { id: orderId.toString() },
        file: { filename: 'proof-uuid.jpg' },
        body: { utr: '987654321098' },
      };
      const res = createMockRes();

      await submitPaymentProof(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(mockOrder.paymentMethod, 'upi');
      assert.equal(mockOrder.paymentStatus, 'pending_verification');
      assert.equal(mockOrder.paymentUtr, '987654321098');
      assert.equal(mockOrder.paymentProof, '/uploads/payments/proof-uuid.jpg');
      assert.equal(mockOrder.saved, true);
    } finally {
      Order.findById = originalFindById;
      Order.findOne = originalFindOne;
    }
  });
});

test('Manual UPI Payment - updateOrderPayment Controller Logic', async (t) => {
  const createMockRes = () => {
    const res = {
      statusCode: null,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  await t.test('Rejects invalid action with 400', async () => {
    const req = {
      user: { id: 'shopkeeper-1', role: 'shopkeeper' },
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { action: 'unknown' },
    };
    const res = createMockRes();

    await updateOrderPayment(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonData.success, false);
  });

  await t.test('Rejects if shopkeeper does not own the order shop with 403', async () => {
    const orderId = new mongoose.Types.ObjectId();
    const shopId = new mongoose.Types.ObjectId();

    const originalOrderFindById = Order.findById;
    const originalShopFindById = Shop.findById;

    Order.findById = async () => ({
      _id: orderId,
      shopId,
    });
    Shop.findById = async () => ({
      _id: shopId,
      shopkeeperId: { toString: () => 'different-shopkeeper' },
    });

    try {
      const req = {
        user: { id: 'shopkeeper-1', role: 'shopkeeper' },
        params: { id: orderId.toString() },
        body: { action: 'confirm' },
      };
      const res = createMockRes();

      await updateOrderPayment(req, res);

      assert.equal(res.statusCode, 403);
      assert.equal(res.jsonData.success, false);
    } finally {
      Order.findById = originalOrderFindById;
      Shop.findById = originalShopFindById;
    }
  });

  await t.test('Confirm sets paymentStatus to paid', async () => {
    const orderId = new mongoose.Types.ObjectId();
    const shopId = new mongoose.Types.ObjectId();

    const mockOrder = {
      _id: orderId,
      shopId,
      paymentStatus: 'pending_verification',
      paymentUtr: '123456789012',
      saved: false,
      async save() {
        this.saved = true;
      },
    };

    const originalOrderFindById = Order.findById;
    const originalShopFindById = Shop.findById;

    Order.findById = async () => mockOrder;
    Shop.findById = async () => ({
      _id: shopId,
      shopkeeperId: { toString: () => 'shopkeeper-1' },
    });

    try {
      const req = {
        user: { id: 'shopkeeper-1', role: 'shopkeeper' },
        params: { id: orderId.toString() },
        body: { action: 'confirm' },
      };
      const res = createMockRes();

      await updateOrderPayment(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(mockOrder.paymentStatus, 'paid');
      assert.equal(mockOrder.paymentUtr, '123456789012');
      assert.equal(mockOrder.saved, true);
    } finally {
      Order.findById = originalOrderFindById;
      Shop.findById = originalShopFindById;
    }
  });

  await t.test('Reject sets paymentStatus to rejected, saves reason, and clears paymentUtr', async () => {
    const orderId = new mongoose.Types.ObjectId();
    const shopId = new mongoose.Types.ObjectId();

    const mockOrder = {
      _id: orderId,
      shopId,
      paymentStatus: 'pending_verification',
      paymentUtr: '123456789012',
      saved: false,
      async save() {
        this.saved = true;
      },
    };

    const originalOrderFindById = Order.findById;
    const originalShopFindById = Shop.findById;

    Order.findById = async () => mockOrder;
    Shop.findById = async () => ({
      _id: shopId,
      shopkeeperId: { toString: () => 'shopkeeper-1' },
    });

    try {
      const req = {
        user: { id: 'shopkeeper-1', role: 'shopkeeper' },
        params: { id: orderId.toString() },
        body: { action: 'reject', reason: 'Invalid screenshot provided' },
      };
      const res = createMockRes();

      await updateOrderPayment(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(mockOrder.paymentStatus, 'rejected');
      assert.equal(mockOrder.paymentRejectReason, 'Invalid screenshot provided');
      assert.equal(mockOrder.paymentUtr, undefined);
      assert.equal(mockOrder.saved, true);
    } finally {
      Order.findById = originalOrderFindById;
      Shop.findById = originalShopFindById;
    }
  });
});

test('Manual UPI Payment - updateShopUpi Controller Logic', async (t) => {
  const createMockRes = () => {
    const res = {
      statusCode: null,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  await t.test('Rejects invalid shop ID with 400', async () => {
    const req = {
      user: { id: 'shopkeeper-1', role: 'shopkeeper' },
      params: { id: 'not-an-id' },
      body: { upiId: 'canteen@upi' },
    };
    const res = createMockRes();

    await updateShopUpi(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonData.success, false);
  });

  await t.test('Rejects missing or empty upiId with 400', async () => {
    const shopId = new mongoose.Types.ObjectId();
    const req = {
      user: { id: 'shopkeeper-1', role: 'shopkeeper' },
      params: { id: shopId.toString() },
      body: { upiId: '   ' },
    };
    const res = createMockRes();

    await updateShopUpi(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonData.success, false);
  });

  await t.test('Rejects if user is not the shop owner with 403', async () => {
    const shopId = new mongoose.Types.ObjectId();
    const originalFindById = Shop.findById;

    Shop.findById = async () => ({
      _id: shopId,
      shopkeeperId: { toString: () => 'other-shopkeeper' },
    });

    try {
      const req = {
        user: { id: 'shopkeeper-1', role: 'shopkeeper' },
        params: { id: shopId.toString() },
        body: { upiId: 'canteen@okhdfcbank' },
      };
      const res = createMockRes();

      await updateShopUpi(req, res);

      assert.equal(res.statusCode, 403);
      assert.equal(res.jsonData.success, false);
    } finally {
      Shop.findById = originalFindById;
    }
  });

  await t.test('Successfully sets upiId for the shop owner', async () => {
    const shopId = new mongoose.Types.ObjectId();
    const mockShop = {
      _id: shopId,
      shopkeeperId: { toString: () => 'shopkeeper-1' },
      upiId: '',
      saved: false,
      async save() {
        this.saved = true;
      },
    };

    const originalFindById = Shop.findById;
    Shop.findById = async () => mockShop;

    try {
      const req = {
        user: { id: 'shopkeeper-1', role: 'shopkeeper' },
        params: { id: shopId.toString() },
        body: { upiId: 'canteen@upi' },
      };
      const res = createMockRes();

      await updateShopUpi(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(mockShop.upiId, 'canteen@upi');
      assert.equal(mockShop.saved, true);
    } finally {
      Shop.findById = originalFindById;
    }
  });
});

test('Manual UPI Payment - Upload Directory', () => {
  assert.ok(uploadDirectory.includes('uploads/payments'));
});

test('Manual UPI Payment - File Filter Validation', async (t) => {
  await t.test('Accepts valid JPG file', (t, done) => {
    fileFilter({}, { originalname: 'screenshot.jpg', mimetype: 'image/jpeg' }, (err, accepted) => {
      assert.equal(err, null);
      assert.equal(accepted, true);
      done();
    });
  });

  await t.test('Accepts valid PNG file', (t, done) => {
    fileFilter({}, { originalname: 'proof.png', mimetype: 'image/png' }, (err, accepted) => {
      assert.equal(err, null);
      assert.equal(accepted, true);
      done();
    });
  });

  await t.test('Accepts valid JPEG file', (t, done) => {
    fileFilter({}, { originalname: 'proof.jpeg', mimetype: 'image/jpeg' }, (err, accepted) => {
      assert.equal(err, null);
      assert.equal(accepted, true);
      done();
    });
  });

  await t.test('Rejects non-image file extensions (.pdf)', (t, done) => {
    fileFilter({}, { originalname: 'document.pdf', mimetype: 'application/pdf' }, (err, accepted) => {
      assert.ok(err, 'Expected error for PDF');
      assert.equal(err.status, 400);
      done();
    });
  });

  await t.test('Rejects mismatched mimetype (.png with text/plain)', (t, done) => {
    fileFilter({}, { originalname: 'image.png', mimetype: 'text/plain' }, (err, accepted) => {
      assert.ok(err, 'Expected error for mismatched mimetype');
      assert.equal(err.status, 400);
      done();
    });
  });
});
