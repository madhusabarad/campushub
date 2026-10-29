
require('dotenv').config();

const mongoose = require('mongoose');

const User = require('../models/User');
const Shop = require('../models/Shop');
const MenuItem = require('../models/MenuItem');

const EXPECTED_DATABASE = 'test';
const EXPECTED_CLUSTER = 'campushub.maskz5p.mongodb.net';

const sampleUsers = [
    {
        name: 'Campus Admin',
        email: 'admin@college.edu',
        password: 'Test@1234',
        role: 'admin',
        collegeId: 'SEED-ADMIN-001',
    },
    {
        name: 'Ravi Student',
        email: 'ravi@college.edu',
        password: 'Test@1234',
        role: 'student',
        collegeId: 'SEED-STUDENT-001',
    },
    {
        name: 'Naina Student',
        email: 'naina@college.edu',
        password: 'Test@1234',
        role: 'student',
        collegeId: 'SEED-STUDENT-002',
    },
    {
        name: 'Arjun Shopkeeper',
        email: 'arjun@college.edu',
        password: 'Test@1234',
        role: 'shopkeeper',
        collegeId: 'SEED-SHOPKEEPER-001',
    },
];

const sampleShops = [
    {
        name: 'Campus Canteen',
        category: 'canteen',
        description:
            'Browse the available food and beverages from the campus canteen.',
        isOpen: true,
    },
    {
        name: 'Akshay Food Court',
        category: 'foodcourt',
        description:
            'Explore food, snacks, beverages and other items at Akshay Food Court.',
        isOpen: true,
    },
    {
        name: 'Campus Bakery',
        category: 'bakery',
        description:
            'Browse bakery items and refreshments from the campus bakery.',
        isOpen: true,
    },
];

const sampleMenuItems = [
    // Campus Canteen: 8 items
    { shopCategory: 'canteen', name: 'Idli', price: 30, category: 'Food' },
    { shopCategory: 'canteen', name: 'Vada', price: 20, category: 'Food' },
    { shopCategory: 'canteen', name: 'Masala Dosa', price: 45, category: 'Food' },
    { shopCategory: 'canteen', name: 'Pongal', price: 35, category: 'Food' },
    { shopCategory: 'canteen', name: 'Tea', price: 15, category: 'Beverages' },
    { shopCategory: 'canteen', name: 'Coffee', price: 20, category: 'Beverages' },
    { shopCategory: 'canteen', name: 'Mango Juice', price: 30, category: 'Juice' },
    { shopCategory: 'canteen', name: 'Chocolate Milkshake', price: 50, category: 'Milk Shakes' },

    // Akshay Food Court: 8 items
    { shopCategory: 'foodcourt', name: 'Veg Fried Rice', price: 100, category: 'Rice Items' },
    { shopCategory: 'foodcourt', name: 'Veg Noodles', price: 90, category: 'Noodles' },
    { shopCategory: 'foodcourt', name: 'Paneer Starter', price: 120, category: 'Paneer Starters' },
    { shopCategory: 'foodcourt', name: 'Gobi Manchurian', price: 100, category: 'Gobi Starters' },
    { shopCategory: 'foodcourt', name: 'Veg Biryani', price: 110, category: 'Biriyani Items' },
    { shopCategory: 'foodcourt', name: 'Masala Papad', price: 35, category: 'Papad' },
    { shopCategory: 'foodcourt', name: 'Fresh Lime Juice', price: 40, category: 'Juice' },
    { shopCategory: 'foodcourt', name: 'Mango Milkshake', price: 60, category: 'Milkshakes' },

    // Campus Bakery: 8 items
    { shopCategory: 'bakery', name: 'Veg Burger', price: 60, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Chocolate Cake', price: 50, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Veg Puff', price: 25, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Chocolate Brownie', price: 45, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Cupcake', price: 35, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Chocolate Donut', price: 40, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Veg Sandwich', price: 55, category: 'Bakery' },
    { shopCategory: 'bakery', name: 'Cheese Roll', price: 40, category: 'Bakery' },
];

function verifyTarget() {
    if (
        process.env.NODE_ENV !== 'development' &&
        process.env.NODE_ENV !== 'test'
    ) {
        throw new Error(
            'Safety stop: NODE_ENV must explicitly be development or test.'
        );
    }

    if (process.env.SEED_TEST_DATABASE !== 'YES') {
        throw new Error(
            'Safety stop: set SEED_TEST_DATABASE=YES to authorize test seeding.'
        );
    }

    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
        throw new Error('Safety stop: required environment configuration is missing.');
    }

    const uri = new URL(process.env.MONGO_URI);
    const databaseName = uri.pathname.slice(1).split('/')[0];

    if (databaseName !== EXPECTED_DATABASE) {
        throw new Error(
            `Safety stop: expected database "${EXPECTED_DATABASE}".`
        );
    }

    if (uri.hostname !== EXPECTED_CLUSTER) {
        throw new Error(
            'Safety stop: MONGO_URI does not point to the approved CampusHub cluster.'
        );
    }
}

async function seedUsers() {
    const usersByEmail = new Map();

    for (const userData of sampleUsers) {
        const existing = await User.findOne({ email: userData.email });

        if (existing) {
            if (existing.role !== userData.role) {
                throw new Error(
                    `Safety stop: ${userData.email} already exists with a different role.`
                );
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
            {
                new: true,
                upsert: true,
                runValidators: true,
            }
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
            $or: [
                { shopkeeperId: null },
                { shopkeeperId: shopkeeper._id },
            ],
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
    console.log('Menu seed target: 8 sample items per shop.');
}

async function main() {
    let connected = false;

    try {
        verifyTarget();

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        connected = true;

        const actualDatabase = mongoose.connection.db.databaseName;
        const actualHost = mongoose.connection.host;

        if (actualDatabase !== EXPECTED_DATABASE) {
            throw new Error('Safety stop: connected database is not test.');
        }

        if (!actualHost.endsWith('.maskz5p.mongodb.net')) {
            throw new Error('Safety stop: connected host is not the approved cluster.');
        }

        console.log('Verified approved CampusHub test database.');
        console.log('No delete operations will be performed.');

        const usersByEmail = await seedUsers();
        const shopkeeper = usersByEmail.get('arjun@college.edu');

        if (!shopkeeper || shopkeeper.role !== 'shopkeeper') {
            throw new Error('Safety stop: test shopkeeper account is missing or invalid.');
        }

        const shopsByCategory = await seedShops(shopkeeper);
        await seedMenuItems(shopsByCategory);

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
