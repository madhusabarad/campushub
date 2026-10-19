
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const mongoose = require('mongoose');

require('dotenv').config();

const Shop = require('../models/Shop');
const MenuItem = require('../models/MenuItem');

const menuFile = path.join(
    __dirname,
    '../frontend/src/Menu.jsx'
);

function extractArray(source, variableName) {
    const declaration = `const ${variableName} = [`;
    const start = source.indexOf(declaration);

    if (start === -1) {
        throw new Error(`Could not find ${variableName} in Menu.jsx`);
    }

    const arrayStart = source.indexOf('[', start);
    let depth = 0;
    let quote = null;
    let escaped = false;

    for (let i = arrayStart; i < source.length; i += 1) {
        const char = source[i];

        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === quote) {
                quote = null;
            }
            continue;
        }

        if (char === "'" || char === '"' || char === '`') {
            quote = char;
            continue;
        }

        if (char === '[') depth += 1;

        if (char === ']') {
            depth -= 1;

            if (depth === 0) {
                const arrayText = source.slice(arrayStart, i + 1);
                return vm.runInNewContext(arrayText);
            }
        }
    }

    throw new Error(`Could not parse ${variableName}`);
}

async function seedMenu() {
    const source = fs.readFileSync(menuFile, 'utf8');

    const menus = [
        {
            name: 'Campus Canteen',
            category: 'canteen',
            description:
                'Browse the available food and beverages from the campus canteen.',
            variable: 'canteenMenu',
        },
        {
            name: 'Akshay Food Court',
            category: 'foodcourt',
            description:
                'Explore the food, snacks, beverages and other items available at Akshay Food Court.',
            variable: 'foodCourtMenu',
        },
        {
            name: 'Campus Bakery',
            category: 'bakery',
            description:
                'Browse snacks, bakery items, burgers and refreshments from the campus bakery.',
            variable: 'bakeryMenu',
        },
    ];

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const menu of menus) {
        const items = extractArray(source, menu.variable);

        const shop = await Shop.findOneAndUpdate(
            { category: menu.category },
            {
                $set: {
                    name: menu.name,
                    description: menu.description,
                },
                $setOnInsert: {
                    category: menu.category,
                    isOpen: true,
                },
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
            }
        );

        console.log(`\n${shop.name}: ${items.length} source entries`);

        for (const item of items) {
            if (item.price === null || item.price === undefined) {
                skipped += 1;
                console.log(
                    `Skipped unavailable item without numeric price: ${item.name}`
                );
                continue;
            }

            const filter = {
                shopId: shop._id,
                name: item.name,
                category: item.category,
                price: item.price,
            };

            const existing = await MenuItem.findOne(filter).select('_id');

            await MenuItem.findOneAndUpdate(
                filter,
                {
                    $set: {
                        isAvailable: item.isAvailable,
                    },
                    $setOnInsert: {
                        shopId: shop._id,
                        name: item.name,
                        category: item.category,
                        price: item.price,
                    },
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true,
                }
            );

            if (existing) {
                updated += 1;
            } else {
                inserted += 1;
            }
        }
    }

    console.log('\n===== SEED SUMMARY =====');
    console.log(`Inserted menu items: ${inserted}`);
    console.log(`Matched existing menu items: ${updated}`);
    console.log(`Skipped items without numeric prices: ${skipped}`);

    const shopCount = await Shop.countDocuments({
        category: { $in: ['canteen', 'foodcourt', 'bakery'] },
    });

    const menuCount = await MenuItem.countDocuments();

    console.log(`Total shops in database: ${shopCount}`);
    console.log(`Total menu items in database: ${menuCount}`);
}

async function main() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is missing from the root .env file');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        await seedMenu();
    } catch (error) {
        console.error('Menu seeding failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

main();
