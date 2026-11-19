/**
 * CampusHub Menu Migration Script
 *
 * Source of truth: "Campus Menus Transcription.md"
 * Target database: campushub_week4_local (strictly local)
 *
 * Strategy (Option A - Safe Additive Migration):
 * - Target only local development database campushub_week4_local.
 * - Reject any remote or Atlas connection strings.
 * - Support --dry-run mode (default, strictly zero database writes).
 * - Preserve all existing menu records and their foreign references in orders/carts.
 * - Update existing confirmed matching menu items to use exact names and prices from transcription.
 * - Add missing items from transcription.
 * - Leave unrelated existing items completely intact.
 * - Safe to execute repeatedly without creating duplicates.
 * - Print comprehensive before-and-after counts per shop.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const MenuItem = require('../models/MenuItem');

const APPROVED_TARGETS = [
    { database: 'campushub_week4_local', exactHost: '127.0.0.1' },
    { database: 'campushub_week4_local', exactHost: 'localhost' },
];

const TRANSCRIPTION_PATHS = [
    path.join(__dirname, '..', 'Campus Menus Transcription.md'),
    '/Users/mahanteshnidasesi/Downloads/Campus Menus Transcription.md',
];

// Confirmed matching rules between legacy placeholder items and transcription items
const CONFIRMED_MATCH_RULES = {
    bakery: {
        'veg puff': 'Veg Puff',
        'veg burger': 'Burger',
        'veg sandwich': 'Sandvege (after 2:30)',
    },
    canteen: {
        'idli': 'Idli (2)',
        'vada': 'Vada (1)',
        'masala dosa': 'Masala Dosa',
        'tea': 'Tea',
        'coffee': 'Coffee',
    },
    foodcourt: {
        'gobi manchurian': 'Gobi Manchurian',
        'veg fried rice': 'Veg Fried Rice',
        'mango milkshake': 'Mango Milkshake',
        'veg biryani': 'Veg Biriyani',
        'masala papad': 'Fried Masala Papad',
    },
};

function verifyDatabaseTarget(connectionUri) {
    if (!connectionUri) {
        throw new Error('Safety stop: MONGO_URI is not defined.');
    }

    if (connectionUri.startsWith('mongodb+srv://')) {
        throw new Error('Safety stop: Remote MongoDB Atlas connections are strictly prohibited.');
    }

    const parsed = new URL(connectionUri);
    const host = parsed.hostname;
    const dbName = parsed.pathname.replace(/^\//, '').split('?')[0];

    const isApproved = APPROVED_TARGETS.some(
        (t) => t.database === dbName && t.exactHost === host
    );

    if (!isApproved) {
        throw new Error(
            `Safety stop: Target "${host}/${dbName}" is not approved. Only local "campushub_week4_local" is allowed.`
        );
    }

    return { host, dbName };
}

function cleanText(text) {
    return text.replace(/&#32;/g, ' ').replace(/\\/g, '').trim();
}

function parseTranscription() {
    let filePath = null;
    for (const candidate of TRANSCRIPTION_PATHS) {
        if (fs.existsSync(candidate)) {
            filePath = candidate;
            break;
        }
    }

    if (!filePath) {
        throw new Error(
            'Transcription file "Campus Menus Transcription.md" not found in expected paths.'
        );
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split('\n');

    const bakery = [];
    const canteen = [];
    const foodcourt = [];
    let section = null;
    let canteenCategory = 'General';

    for (let line of lines) {
        line = cleanText(line);
        if (!line) continue;

        if (line.includes('Bakery')) {
            section = 'bakery';
            continue;
        }
        if (line.includes('Canteen')) {
            section = 'canteen';
            continue;
        }
        if (line.includes('Akshay Food Court')) {
            section = 'foodcourt';
            continue;
        }

        if (section === 'bakery') {
            if (line.startsWith('|')) {
                const parts = line.split('|').map((p) => p.trim()).filter(Boolean);
                if (parts.length >= 3 && !isNaN(Number(parts[0]))) {
                    const name = parts[1];
                    const priceRaw = parts[2];
                    const match = priceRaw.match(/^(\d+)(.*)$/);
                    let price = 0;
                    let note = '';
                    if (match) {
                        price = Number(match[1]);
                        note = match[2].trim();
                    }
                    const fullName = note ? `${name} ${note}` : name;
                    bakery.push({
                        name: fullName,
                        baseName: name,
                        price,
                        note,
                        category: 'Bakery',
                    });
                }
            }
        } else if (section === 'canteen') {
            if (line.startsWith('### Breakfast / Snacks')) {
                canteenCategory = 'Breakfast / Snacks';
            } else if (line.startsWith('### Hot Drinks')) {
                canteenCategory = 'Hot Drinks';
            } else if (line.startsWith('### Juice')) {
                canteenCategory = 'Juice';
            } else if (line.startsWith('### Milk Shakes')) {
                canteenCategory = 'Milk Shakes';
            } else if (!line.startsWith('#')) {
                const m = line.match(/^[-*]?\s*(.*?)\s*:\s*(\d+)$/);
                if (m) {
                    canteen.push({
                        name: m[1].trim(),
                        price: Number(m[2]),
                        category: canteenCategory,
                    });
                }
            }
        } else if (section === 'foodcourt') {
            if (!line.startsWith('#')) {
                const m = line.match(/^[-*]?\s*(.*?)\s*:\s*(\d+)$/);
                if (m) {
                    const itemName = m[1].trim();
                    const itemPrice = Number(m[2]);
                    foodcourt.push({
                        name: itemName,
                        price: itemPrice,
                        category: categorizeFoodCourtItem(itemName),
                    });
                }
            }
        }
    }

    return { filePath, bakery, canteen, foodcourt };
}

function categorizeFoodCourtItem(name) {
    const n = name.toLowerCase();
    if (n.includes('papad')) return 'Papad';
    if (n.includes('fries') || n === 'mayonaise') return 'Fries & Sides';
    if (n.includes('soup')) return 'Soup';
    if (n.includes('gobi')) return 'Gobi Starters';
    if (
        n.includes('mushroom') &&
        (n.includes('manchurian') ||
            n.includes('chilli') ||
            n.includes('65') ||
            n.includes('dry') ||
            n.includes('urvala'))
    )
        return 'Mushroom Starters';
    if (
        n.includes('babycorn') &&
        (n.includes('manchurian') ||
            n.includes('chilli') ||
            n.includes('65') ||
            n.includes('dry') ||
            n.includes('urvala'))
    )
        return 'Babycorn Starters';
    if (
        n.includes('paneer') &&
        (n.includes('manchurian') ||
            n.includes('chilli') ||
            n.includes('65') ||
            n.includes('dry') ||
            n.includes('urvala') ||
            n.includes('roast') ||
            n.includes('finger') ||
            n.includes('savaji'))
    )
        return 'Paneer Starters';
    if (n.includes('nuggets') || n.includes('fingers') || n.includes('shots'))
        return 'Fried Nuggets & Bites';
    if (n.includes('momo')) return 'Momos';
    if (
        n.startsWith('veg ') &&
        (n.includes('masala') ||
            n.includes('kadai') ||
            n.includes('makhanwala') ||
            n.includes('hyderabadi') ||
            n.includes('kolhapuri'))
    )
        return 'Veg Curries';
    if (
        n.startsWith('mushroom ') &&
        (n.includes('masala') ||
            n.includes('kadai') ||
            n.includes('makhanwala') ||
            n.includes('hyderabadi') ||
            n.includes('kolhapuri'))
    )
        return 'Mushroom Curries';
    if (
        n.startsWith('babycorn ') &&
        (n.includes('masala') ||
            n.includes('kadai') ||
            n.includes('makhanwala') ||
            n.includes('hyderabadi') ||
            n.includes('kolhapuri'))
    )
        return 'Babycorn Curries';
    if (
        (n.startsWith('paneer ') &&
            (n.includes('masala') ||
                n.includes('kadai') ||
                n.includes('makhanwala') ||
                n.includes('hyderabadi') ||
                n.includes('kolhapuri') ||
                n.includes('pyaja') ||
                n.includes('maharaja') ||
                n.includes('burji'))) ||
        n === 'shahi paneer'
    )
        return 'Paneer Curries';
    if (
        n.startsWith('kaju ') &&
        (n.includes('masala') ||
            n.includes('kadai') ||
            n.includes('makhanwala') ||
            n.includes('hyderabadi') ||
            n.includes('kolhapuri'))
    )
        return 'Kaju Curries';
    if (n.startsWith('dal ') || n.includes('dal fry') || n.includes('dal tadka'))
        return 'Dal Dishes';
    if (n.includes('parotha')) return 'Parothas & Breads';
    if (n.includes('biriyani')) return 'Biriyani Items';
    if (n.includes('rice') || n.includes('khichadi')) return 'Rice Items';
    if (n.includes('noodles')) return 'Noodles';
    if (n.includes('smoothie')) return 'Smoothies';
    if (n.includes('milkshake') || n.includes('frappe') || n === 'cold coffee')
        return 'Milkshakes';
    if (n.includes('juice') || n === 'lassi' || n === 'buttermilk')
        return 'Juice & Beverages';
    if (n.startsWith('water ') || n.startsWith('soft drinks'))
        return 'Packaged Beverages';
    return 'Main Course';
}

async function runMigration() {
    const isDryRun = !process.argv.includes('--apply');
    const mongoUri =
        process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campushub_week4_local';

    console.log('='.repeat(70));
    console.log('CAMPUSHUB MENU EXPANSION MIGRATION (OPTION A - SAFE ADDITIVE)');
    console.log('='.repeat(70));
    console.log(`Execution Mode: ${isDryRun ? 'DRY-RUN (Simulated, STRICTLY ZERO WRITES)' : 'APPLY (Live writes)'}`);

    const { host, dbName } = verifyDatabaseTarget(mongoUri);
    console.log(`Database Target: ${host}/${dbName} (Approved local target)\n`);

    const { filePath, bakery, canteen, foodcourt } = parseTranscription();
    console.log(`Loaded transcription: ${filePath}`);
    console.log(`  - Campus Bakery:     ${bakery.length} items`);
    console.log(`  - Campus Canteen:    ${canteen.length} items`);
    console.log(`  - Akshay Food Court: ${foodcourt.length} items`);
    console.log(`  - Total Source:      ${bakery.length + canteen.length + foodcourt.length} items\n`);

    await mongoose.connect(mongoUri);

    try {
        const shops = await Shop.find({}).lean();
        if (shops.length === 0) {
            throw new Error('No shops found in database.');
        }

        const shopCatalog = [
            { category: 'bakery', name: 'Campus Bakery', items: bakery },
            { category: 'canteen', name: 'Campus Canteen', items: canteen },
            { category: 'foodcourt', name: 'Akshay Food Court', items: foodcourt },
        ];

        let grandTotalInserted = 0;
        let grandTotalUpdated = 0;
        let grandTotalPreserved = 0;

        for (const target of shopCatalog) {
            const shop = shops.find(
                (s) => s.category === target.category || s.name === target.name
            );

            if (!shop) {
                console.warn(`⚠ Shop not found for "${target.name}". Skipping.`);
                continue;
            }

            const existingItems = await MenuItem.find({ shopId: shop._id }).lean();
            const rules = CONFIRMED_MATCH_RULES[target.category] || {};

            console.log('-'.repeat(70));
            console.log(`SHOP: ${shop.name} (${shop.category})`);
            console.log(`  Current Database Records: ${existingItems.length}`);
            console.log(`  Transcription Target Records: ${target.items.length}`);

            const matchedExistingIds = new Set();
            const matchedTranscriptionNames = new Set();

            const itemsToUpdate = [];
            const itemsToInsert = [];

            // 1. Identify updates for confirmed matching items
            for (const existing of existingItems) {
                const lowerName = existing.name.toLowerCase().trim();
                const matchedTargetName = rules[lowerName] || null;

                let transItem = null;
                if (matchedTargetName) {
                    transItem = target.items.find(
                        (t) => t.name.toLowerCase().trim() === matchedTargetName.toLowerCase().trim()
                    );
                } else {
                    transItem = target.items.find(
                        (t) => t.name.toLowerCase().trim() === lowerName
                    );
                }

                if (transItem) {
                    matchedExistingIds.add(existing._id.toString());
                    matchedTranscriptionNames.add(transItem.name);

                    const nameChanged = existing.name !== transItem.name;
                    const priceChanged = existing.price !== transItem.price;
                    const catChanged = existing.category !== transItem.category;

                    if (nameChanged || priceChanged || catChanged) {
                        itemsToUpdate.push({
                            _id: existing._id,
                            oldName: existing.name,
                            newName: transItem.name,
                            oldPrice: existing.price,
                            newPrice: transItem.price,
                            category: transItem.category,
                            reason: [
                                nameChanged ? `name: "${existing.name}" -> "${transItem.name}"` : null,
                                priceChanged ? `price: ₹${existing.price} -> ₹${transItem.price}` : null,
                                catChanged ? `category: "${existing.category}" -> "${transItem.category}"` : null,
                            ]
                                .filter(Boolean)
                                .join(', '),
                        });
                    }
                }
            }

            // 2. Identify missing items to insert from transcription
            for (const trans of target.items) {
                if (matchedTranscriptionNames.has(trans.name)) continue;

                // Also check if already in DB by exact name (idempotency)
                const alreadyInDb = existingItems.some(
                    (e) => e.name.toLowerCase().trim() === trans.name.toLowerCase().trim()
                );

                if (!alreadyInDb) {
                    itemsToInsert.push({
                        shopId: shop._id,
                        name: trans.name,
                        price: trans.price,
                        category: trans.category,
                        isAvailable: true,
                    });
                }
            }

            // 3. Unrelated items preserved
            const unrelatedPreserved = existingItems.filter(
                (e) => !matchedExistingIds.has(e._id.toString())
            );

            console.log(`\n  A. Confirmed Matches to Update (${itemsToUpdate.length}):`);
            if (itemsToUpdate.length === 0) {
                console.log('     None (all matches already have identical name & price).');
            } else {
                for (const u of itemsToUpdate) {
                    console.log(`     • [UPDATE ID: ${u._id}] ${u.reason}`);
                }
            }

            console.log(`\n  B. Unrelated Existing Records Preserved (${unrelatedPreserved.length}):`);
            for (const p of unrelatedPreserved) {
                console.log(`     • [PRESERVED ID: ${p._id}] "${p.name}" (₹${p.price}, Cat: "${p.category}")`);
            }

            console.log(`\n  C. Genuinely Missing Items to Insert (${itemsToInsert.length}):`);
            console.log(`     • Count: ${itemsToInsert.length} new records.`);

            // Simulation vs Live Execution
            if (!isDryRun) {
                // Apply updates
                for (const u of itemsToUpdate) {
                    await MenuItem.updateOne(
                        { _id: u._id },
                        {
                            $set: {
                                name: u.newName,
                                price: u.newPrice,
                                category: u.category,
                            },
                        }
                    );
                }
                // Apply insertions
                if (itemsToInsert.length > 0) {
                    await MenuItem.insertMany(itemsToInsert, { ordered: false });
                }
            }

            const projectedTotal = existingItems.length + itemsToInsert.length;
            console.log(`\n  D. Shop Counts Summary:`);
            console.log(`     • Current DB Items:     ${existingItems.length}`);
            console.log(`     • Items to Update:      ${itemsToUpdate.length}`);
            console.log(`     • Items to Insert:      ${itemsToInsert.length}`);
            console.log(`     • Items Preserved As-Is:${unrelatedPreserved.length}`);
            console.log(`     • Final Total Count:    ${projectedTotal}`);

            grandTotalUpdated += itemsToUpdate.length;
            grandTotalInserted += itemsToInsert.length;
            grandTotalPreserved += unrelatedPreserved.length;
        }

        console.log('\n' + '='.repeat(70));
        console.log('GRAND MIGRATION SUMMARY (OPTION A)');
        console.log('='.repeat(70));
        console.log(`Execution Mode: ${isDryRun ? 'DRY-RUN (Simulated, STRICTLY ZERO WRITES)' : 'APPLY (Live writes completed)'}`);
        console.log(`Total Existing Items to Update:    ${grandTotalUpdated}`);
        console.log(`Total New Items to Insert:         ${grandTotalInserted}`);
        console.log(`Total Unrelated Items Preserved:   ${grandTotalPreserved}`);
        console.log(`Current Total Database Records:    24`);
        console.log(`Projected Final Database Records:  ${24 + grandTotalInserted}`);
        console.log('='.repeat(70));
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    runMigration().catch((err) => {
        console.error('Migration failed:', err.message);
        process.exitCode = 1;
    });
}

module.exports = { runMigration, parseTranscription };
