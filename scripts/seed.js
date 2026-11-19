require('dotenv').config();

const mongoose = require('mongoose');

const User = require('../models/User');
const Shop = require('../models/Shop');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Notification = require('../models/Notification');

// Only these targets may be seeded (strictly local development).
const APPROVED_TARGETS = [
    { database: 'campushub_week4_local', exactHost: '127.0.0.1' },
    { database: 'campushub_week4_local', exactHost: 'localhost' },
];

const sampleUsers = [
    { name: 'Campus Admin', email: 'admin@college.edu', password: 'Test@1234', role: 'admin', collegeId: 'SEED-ADMIN-001' },
    { name: 'Ravi Student', email: 'ravi@college.edu', password: 'Test@1234', role: 'student', collegeId: 'SEED-STUDENT-001' },
    { name: 'Naina Student', email: 'naina@college.edu', password: 'Test@1234', role: 'student', collegeId: 'SEED-STUDENT-002' },
    { name: 'Arjun Shopkeeper', email: 'arjun@college.edu', password: 'Test@1234', role: 'shopkeeper', collegeId: 'SEED-SHOPKEEPER-001' },
    { name: 'Priya Faculty', email: 'priya@college.edu', password: 'Test@1234', role: 'faculty', collegeId: 'SEED-FACULTY-001' },
];

const sampleShops = [
    { name: 'Campus Canteen', category: 'canteen', description: 'Browse the available food and beverages from the campus canteen.', isOpen: true },
    { name: 'Akshay Food Court', category: 'foodcourt', description: 'Explore food, snacks, beverages and other items at Akshay Food Court.', isOpen: true },
    { name: 'Campus Bakery', category: 'bakery', description: 'Browse bakery items and refreshments from the campus bakery.', isOpen: true },
];

const sampleMenuItems = [
    { shopCategory: 'canteen', name: 'Idli', price: 30, category: 'Food' },
    { shopCategory: 'canteen', name: 'Vada', price: 20, category: 'Food' },
    { shopCategory: 'canteen', name: 'Masala Dosa', price: 45, category: 'Food' },
    { shopCategory: 'canteen', name: 'Pongal', price: 35, category: 'Food' },
    { shopCategory: 'canteen', name: 'Tea', price: 15, category: 'Beverages' },
    { shopCategory: 'canteen', name: 'Coffee', price: 20, category: 'Beverages' },
    { shopCategory: 'canteen', name: 'Mango Juice', price: 30, category: 'Juice' },
    { shopCategory: 'canteen', name: 'Chocolate Milkshake', price: 50, category: 'Milk Shakes' },
    { shopCategory: 'foodcourt', name: 'Veg Fried Rice', price: 100, category: 'Rice Items' },
    { shopCategory: 'foodcourt', name: 'Veg Noodles', price: 90, category: 'Noodles' },
    { shopCategory: 'foodcourt', name: 'Paneer Starter', price: 120, category: 'Paneer Starters' },
    { shopCategory: 'foodcourt', name: 'Gobi Manchurian', price: 100, category: 'Gobi Starters' },
    { shopCategory: 'foodcourt', name: 'Veg Biryani', price: 110, category: 'Biriyani Items' },
    { shopCategory: 'foodcourt', name: 'Masala Papad', price: 35, category: 'Papad' },
    { shopCategory: 'foodcourt', name: 'Fresh Lime Juice', price: 40, category: 'Juice' },
    { shopCategory: 'foodcourt', name: 'Mango Milkshake', price: 60, category: 'Milkshakes' },
    { shopCategory: 'bakery', name: 'Veg Burger', price: 60, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Chocolate Cake', price: 50, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Veg Puff', price: 25, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Chocolate Brownie', price: 45, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Cupcake', price: 35, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Chocolate Donut', price: 40, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Veg Sandwich', price: 55, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Cheese Roll', price: 40, category: 'Bakery' },
];

// Deterministic order tokens stop duplicate seeded orders on re-runs.
const sampleOrders = [
    { orderToken: 'CH-SEED-RAVI-001', userEmail: 'ravi@college.edu', shopCategory: 'canteen', status: 'completed', paymentStatus: 'paid', daysAgo: 3, items: [{ name: 'Idli', quantity: 2 }, { name: 'Tea', quantity: 1 }] },
    { orderToken: 'CH-SEED-NAINA-001', userEmail: 'naina@college.edu', shopCategory: 'bakery', status: 'completed', paymentStatus: 'paid', daysAgo: 2, items: [{ name: 'Veg Burger', quantity: 1 }, { name: 'Chocolate Cake', quantity: 1 }] },
    { orderToken: 'CH-SEED-NAINA-002', userEmail: 'naina@college.edu', shopCategory: 'foodcourt', status: 'completed', paymentStatus: 'paid', daysAgo: 1, items: [{ name: 'Veg Biryani', quantity: 1 }, { name: 'Mango Milkshake', quantity: 1 }] },
    // Completed but intentionally NOT reviewed, so a review can be tested live.
    { orderToken: 'CH-SEED-RAVI-003', userEmail: 'ravi@college.edu', shopCategory: 'canteen', status: 'completed', paymentStatus: 'paid', daysAgo: 1, items: [{ name: 'Masala Dosa', quantity: 1 }, { name: 'Coffee', quantity: 2 }] },
    { orderToken: 'CH-SEED-RAVI-002', userEmail: 'ravi@college.edu', shopCategory: 'foodcourt', status: 'placed', paymentStatus: 'pending', daysAgo: 0, items: [{ name: 'Veg Fried Rice', quantity: 1 }, { name: 'Fresh Lime Juice', quantity: 1 }] },
];

// Reviews are only created for completed orders.
const sampleReviews = [
    { orderToken: 'CH-SEED-RAVI-001', rating: 5, comment: 'Good food and quick service.' },
    { orderToken: 'CH-SEED-NAINA-001', rating: 4, comment: 'Fresh bakery items and good taste.' },
    { orderToken: 'CH-SEED-NAINA-002', rating: 3, comment: 'Tasty, but the wait was a bit long.' },
];

const STATUS_FLOW = ['placed', 'preparing', 'ready', 'completed'];

function matchesApprovedTarget(databaseName, host) {
    return APPROVED_TARGETS.some(
        (t) =>
            t.database === databaseName &&
            (host === t.exactHost || (t.hostSuffix && host.endsWith(t.hostSuffix)))
    );
}

function verifyEnvironment() {
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
        throw new Error('Safety stop: NODE_ENV must explicitly be development or test.');
    }

    if (process.env.SEED_TEST_DATABASE !== 'YES') {
        throw new Error('Safety stop: set SEED_TEST_DATABASE=YES to authorize test seeding.');
    }

    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
        throw new Error('Safety stop: required environment configuration is missing.');
    }

    const uri = new URL(process.env.MONGO_URI);
    const databaseName = uri.pathname.slice(1).split('/')[0];

    if (!matchesApprovedTarget(databaseName, uri.hostname)) {
        throw new Error('Safety stop: MONGO_URI is not an approved seed target.');
    }
}

async function seedUsers() {
    const usersByEmail = new Map();

    for (const userData of sampleUsers) {
        const existing = await User.findOne({ email: userData.email });

        if (existing) {
            if (existing.role !== userData.role) {
                throw new Error(`Safety stop: ${userData.email} already exists with a different role.`);
            }
            console.log(`Preserved existing user: ${userData.email}`);
            usersByEmail.set(userData.email, existing);
            continue;
        }

        // The User model hashes the password in its pre-save hook.
        const user = await User.create(userData);
        console.log(`Created user: ${userData.email}`);
        usersByEmail.set(userData.email, user);
    }

    return usersByEmail;
}

async function seedShops(shopkeeper) {
    const shopsByCategory = new Map();

    for (const shopData of sampleShops) {
        const shop = await Shop.findOneAndUpdate(
            { category: shopData.category },
            { $setOnInsert: shopData },
            { new: true, upsert: true, runValidators: true }
        );

        shopsByCategory.set(shopData.category, shop);
        console.log(`Verified shop: ${shop.name}`);
    }

    // Link the test shopkeeper to the Campus Canteen.
    // Never silently replace a different existing shopkeeper.
    const canteen = shopsByCategory.get('canteen');

    await Shop.updateOne(
        {
            _id: canteen._id,
            $or: [{ shopkeeperId: null }, { shopkeeperId: shopkeeper._id }],
        },
        { $set: { shopkeeperId: shopkeeper._id } }
    );

    const verifiedCanteen = await Shop.findById(canteen._id);

    if (
        !verifiedCanteen ||
        !verifiedCanteen.shopkeeperId ||
        verifiedCanteen.shopkeeperId.toString() !== shopkeeper._id.toString()
    ) {
        throw new Error(
            'Safety stop: Campus Canteen is assigned to a different shopkeeper. No reassignment was made.'
        );
    }

    console.log('Verified shopkeeper link: Arjun Shopkeeper -> Campus Canteen');
    return shopsByCategory;
}

async function seedMenuItems(shopsByCategory) {
    let created = 0;
    let preserved = 0;

    for (const item of sampleMenuItems) {
        const shop = shopsByCategory.get(item.shopCategory);

        if (!shop) {
            throw new Error(`Missing shop for category: ${item.shopCategory}`);
        }

        const existing = await MenuItem.findOne({
            shopId: shop._id,
            name: item.name,
            category: item.category,
        });

        if (existing) {
            preserved += 1;
            continue;
        }

        await MenuItem.create({
            shopId: shop._id,
            name: item.name,
            category: item.category,
            price: item.price,
            isAvailable: true,
        });
        created += 1;
    }

    console.log(`Created menu items: ${created}`);
    console.log(`Preserved existing menu items: ${preserved}`);
}

async function seedOrders(usersByEmail, shopsByCategory) {
    const ordersByToken = new Map();
    let created = 0;

    for (const orderData of sampleOrders) {
        const user = usersByEmail.get(orderData.userEmail);
        const shop = shopsByCategory.get(orderData.shopCategory);

        if (!user || !shop) {
            throw new Error(`Safety stop: missing user or shop for order ${orderData.orderToken}.`);
        }

        const existing = await Order.findOne({ orderToken: orderData.orderToken });

        if (existing) {
            if (
                existing.userId.toString() !== user._id.toString() ||
                existing.shopId.toString() !== shop._id.toString()
            ) {
                throw new Error(
                    `Safety stop: order ${orderData.orderToken} already exists with a different user or shop.`
                );
            }
            ordersByToken.set(orderData.orderToken, existing);
            continue;
        }

        // Build item snapshots and the total from the real seeded menu prices.
        const items = [];
        let totalAmount = 0;

        for (const line of orderData.items) {
            const menuItem = await MenuItem.findOne({ shopId: shop._id, name: line.name });

            if (!menuItem) {
                throw new Error(`Safety stop: menu item "${line.name}" not found for order ${orderData.orderToken}.`);
            }

            items.push({
                menuItemId: menuItem._id,
                name: menuItem.name,
                quantity: line.quantity,
                price: menuItem.price,
            });
            totalAmount += menuItem.price * line.quantity;
        }

        const createdAt = new Date(Date.now() - orderData.daysAgo * 24 * 60 * 60 * 1000);
        const steps = STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(orderData.status) + 1);
        const statusHistory = steps.map((status, i) => ({
            status,
            changedAt: new Date(createdAt.getTime() + i * 5 * 60 * 1000),
            note: i === 0 ? 'Order created' : `Status changed to ${status}`,
        }));

        const order = await Order.create({
            userId: user._id,
            shopId: shop._id,
            items,
            totalAmount,
            orderToken: orderData.orderToken,
            paymentMethod: 'pay_at_counter',
            paymentStatus: orderData.paymentStatus,
            status: orderData.status,
            statusHistory,
            createdAt,
        });

        ordersByToken.set(orderData.orderToken, order);
        created += 1;
        console.log(`Created order: ${orderData.orderToken} (total Rs ${totalAmount})`);
    }

    console.log(`Created orders: ${created}`);
    return ordersByToken;
}

async function seedReviews(ordersByToken) {
    let created = 0;

    for (const reviewData of sampleReviews) {
        const order = ordersByToken.get(reviewData.orderToken);

        if (!order) {
            throw new Error(`Safety stop: order ${reviewData.orderToken} not found for review.`);
        }

        if (order.status !== 'completed') {
            throw new Error(`Safety stop: order ${reviewData.orderToken} is not completed, so it cannot be reviewed.`);
        }

        const existing = await Review.findOne({ orderId: order._id });

        if (existing) {
            if (
                existing.userId.toString() !== order.userId.toString() ||
                existing.shopId.toString() !== order.shopId.toString()
            ) {
                throw new Error(`Safety stop: review for ${reviewData.orderToken} exists with different user or shop.`);
            }
            continue;
        }

        await Review.create({
            userId: order.userId,
            shopId: order.shopId,
            orderId: order._id,
            rating: reviewData.rating,
            comment: reviewData.comment,
        });
        created += 1;
    }

    console.log(`Created reviews: ${created}`);
}

async function seedNotifications(ordersByToken) {
    let created = 0;

    for (const [token, order] of ordersByToken) {
        const existing = await Notification.findOne({ userId: order.userId, orderId: order._id });

        if (existing) {
            continue;
        }

        const message =
            order.status === 'completed'
                ? `Your order ${token} has been completed.`
                : `Your order ${token} has been placed.`;

        await Notification.create({
            userId: order.userId,
            orderId: order._id,
            message,
            type: 'order',
            isRead: false,
        });
        created += 1;
    }

    console.log(`Created notifications: ${created}`);
}

async function main() {
    let connected = false;

    try {
        verifyEnvironment();

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        connected = true;

        const actualDatabase = mongoose.connection.db.databaseName;
        const actualHost = mongoose.connection.host;

        if (!matchesApprovedTarget(actualDatabase, actualHost)) {
            throw new Error('Safety stop: connected database/host is not an approved seed target.');
        }

        console.log(`Verified approved seed target: ${actualDatabase}`);
        console.log('No delete operations will be performed.');

        const usersByEmail = await seedUsers();
        const shopkeeper = usersByEmail.get('arjun@college.edu');

        if (!shopkeeper || shopkeeper.role !== 'shopkeeper') {
            throw new Error('Safety stop: test shopkeeper account is missing or invalid.');
        }

        const shopsByCategory = await seedShops(shopkeeper);
        await seedMenuItems(shopsByCategory);
        const ordersByToken = await seedOrders(usersByEmail, shopsByCategory);
        await seedReviews(ordersByToken);
        await seedNotifications(ordersByToken);

        console.log('Seed completed successfully.');
    } catch (error) {
        console.error('Seed failed:', error.message);
        process.exitCode = 1;
    } finally {
        if (connected) {
            await mongoose.disconnect();
        }
    }
}

main();
