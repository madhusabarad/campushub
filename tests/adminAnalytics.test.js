const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildRevenuePerShop,
    buildPopularItems,
    buildDailyOrders,
} = require('../utils/adminAnalytics');

test('buildRevenuePerShop includes shops with no orders', () => {
    const shops = [
        { _id: 'shop1', name: 'Canteen' },
        { _id: 'shop2', name: 'Bakery' },
    ];

    const revenueRows = [
        { shopId: 'shop1', revenue: 500, orderCount: 10 },
    ];

    const result = buildRevenuePerShop(shops, revenueRows);

    assert.equal(result.length, 2);
    assert.deepEqual(result[0], {
        shopId: 'shop1',
        shopName: 'Canteen',
        revenue: 500,
        orderCount: 10,
    });
    assert.deepEqual(result[1], {
        shopId: 'shop2',
        shopName: 'Bakery',
        revenue: 0,
        orderCount: 0,
    });
});

test('buildRevenuePerShop sorts by revenue, then shop name', () => {
    const shops = [
        { _id: 'shop1', name: 'Canteen' },
        { _id: 'shop2', name: 'Bakery' },
        { _id: 'shop3', name: 'Food Court' },
    ];

    const revenueRows = [
        { shopId: 'shop1', revenue: 300, orderCount: 3 },
        { shopId: 'shop2', revenue: 500, orderCount: 5 },
        { shopId: 'shop3', revenue: 300, orderCount: 4 },
    ];

    const result = buildRevenuePerShop(shops, revenueRows);

    assert.deepEqual(
        result.map((shop) => shop.shopName),
        ['Bakery', 'Canteen', 'Food Court']
    );
});

test('buildPopularItems combines quantities and revenue', () => {
    const orders = [
        {
            status: 'completed',
            items: [
                {
                    menuItemId: 'item1',
                    name: 'Idli',
                    quantity: 2,
                    price: 20,
                },
            ],
        },
        {
            status: 'placed',
            items: [
                {
                    menuItemId: 'item1',
                    name: 'Idli',
                    quantity: 3,
                    price: 20,
                },
                {
                    menuItemId: 'item2',
                    name: 'Vada',
                    quantity: 1,
                    price: 15,
                },
            ],
        },
    ];

    const result = buildPopularItems(orders);

    assert.deepEqual(result[0], {
        menuItemId: 'item1',
        name: 'Idli',
        quantitySold: 5,
        revenue: 100,
    });

    assert.deepEqual(result[1], {
        menuItemId: 'item2',
        name: 'Vada',
        quantitySold: 1,
        revenue: 15,
    });
});

test('buildPopularItems excludes cancelled orders', () => {
    const orders = [
        {
            status: 'cancelled',
            items: [
                {
                    menuItemId: 'item1',
                    name: 'Idli',
                    quantity: 100,
                    price: 20,
                },
            ],
        },
        {
            status: 'completed',
            items: [
                {
                    menuItemId: 'item2',
                    name: 'Vada',
                    quantity: 2,
                    price: 15,
                },
            ],
        },
    ];

    const result = buildPopularItems(orders);

    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'Vada');
    assert.equal(result[0].quantitySold, 2);
});

test('buildPopularItems respects the requested limit', () => {
    const orders = [{
        status: 'completed',
        items: [
            { menuItemId: '1', name: 'Idli', quantity: 5, price: 10 },
            { menuItemId: '2', name: 'Vada', quantity: 4, price: 10 },
            { menuItemId: '3', name: 'Dosa', quantity: 3, price: 20 },
        ],
    }];

    const result = buildPopularItems(orders, 2);

    assert.equal(result.length, 2);
    assert.deepEqual(
        result.map((item) => item.name),
        ['Idli', 'Vada']
    );
});

test('buildDailyOrders groups orders by UTC date and sorts dates', () => {
    const orders = [
        { createdAt: new Date('2026-10-21T12:00:00.000Z') },
        { createdAt: new Date('2026-10-20T08:00:00.000Z') },
        { createdAt: new Date('2026-10-21T18:00:00.000Z') },
    ];

    assert.deepEqual(buildDailyOrders(orders), [
        { date: '2026-10-20', count: 1 },
        { date: '2026-10-21', count: 2 },
    ]);
});

test('buildDailyOrders ignores invalid date values', () => {
    const orders = [
        { createdAt: '2026-10-21' },
        { createdAt: null },
        { createdAt: new Date('2026-10-21T12:00:00.000Z') },
    ];

    assert.deepEqual(buildDailyOrders(orders), [
        { date: '2026-10-21', count: 1 },
    ]);
});