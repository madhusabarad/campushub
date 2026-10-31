
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const protect = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const shopkeeperMiddleware = require('../middleware/shopkeeperMiddleware');

const TEST_SECRET = 'campushub-automated-test-secret';
process.env.JWT_SECRET = TEST_SECRET;

const createResponse = () => {
    const res = {
        statusCode: 200,
        body: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.body = data;
            return this;
        },
    };

    return res;
};

const createToken = (role, expiresIn = '1h') => {
    return jwt.sign(
        { id: 'test-user-123', role },
        TEST_SECRET,
        { expiresIn }
    );
};

test('rejects requests without a JWT token', () => {
    const req = { headers: {} };
    const res = createResponse();
    let nextCalled = false;

    protect(req, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(nextCalled, false);
});

test('rejects invalid JWT tokens', () => {
    const req = {
        headers: {
            authorization: 'Bearer invalid-token',
        },
    };

    const res = createResponse();
    let nextCalled = false;

    protect(req, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.equal(nextCalled, false);
});

test('rejects expired JWT tokens', () => {
    const expiredToken = createToken('student', '-1s');

    const req = {
        headers: {
            authorization: `Bearer ${expiredToken}`,
        },
    };

    const res = createResponse();
    let nextCalled = false;

    protect(req, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
});

test('accepts a valid student token', () => {
    const token = createToken('student');

    const req = {
        headers: {
            authorization: `Bearer ${token}`,
        },
    };

    const res = createResponse();
    let nextCalled = false;

    protect(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.user.id, 'test-user-123');
    assert.equal(req.user.role, 'student');
});

test('rejects admin access when authentication is missing', () => {
    const req = {};
    const res = createResponse();
    let nextCalled = false;

    adminMiddleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
});

test('rejects non-admin users from admin routes', () => {
    const req = {
        user: {
            id: 'student-123',
            role: 'student',
        },
    };

    const res = createResponse();
    let nextCalled = false;

    adminMiddleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
});

test('allows admin users through admin middleware', () => {
    const req = {
        user: {
            id: 'admin-123',
            role: 'admin',
        },
    };

    const res = createResponse();
    let nextCalled = false;

    adminMiddleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
});

test('rejects non-shopkeepers from shopkeeper routes', () => {
    const req = {
        user: {
            id: 'student-123',
            role: 'student',
        },
    };

    const res = createResponse();
    let nextCalled = false;

    shopkeeperMiddleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
});

test('allows shopkeepers through shopkeeper middleware', () => {
    const req = {
        user: {
            id: 'shopkeeper-123',
            role: 'shopkeeper',
        },
    };

    const res = createResponse();
    let nextCalled = false;

    shopkeeperMiddleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
});
