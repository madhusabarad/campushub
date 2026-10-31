const test = require('node:test');
const assert = require('node:assert/strict');

const {
    moveShopkeeperToShop,
} = require('../utils/shopkeeperAssignment');

const createMocks = () => {
    const shop = {
        _id: 'shop-2',
        shopkeeperId: null,
        saveCalled: false,
        populateCalled: false,

        async save() {
            this.saveCalled = true;
        },

        async populate(field, selection) {
            this.populateCalled = true;
            this.populatedField = field;
            this.populatedSelection = selection;
            return this;
        },
    };

    const shopkeeper = {
        _id: 'shopkeeper-1',
        name: 'Arjun',
        role: 'shopkeeper',
    };

    const calls = [];

    const Shop = {
        async updateMany(filter, update) {
            calls.push({ filter, update });
        },
    };

    return { Shop, shop, shopkeeper, calls };
};

test('clears the shopkeeper from previously assigned shops', async () => {
    const { Shop, shop, shopkeeper, calls } = createMocks();

    await moveShopkeeperToShop({ Shop, shop, shopkeeper });

    assert.equal(calls.length, 1);

    assert.deepEqual(calls[0].filter, {
        shopkeeperId: 'shopkeeper-1',
        _id: { $ne: 'shop-2' },
    });

    assert.deepEqual(calls[0].update, {
        $set: { shopkeeperId: null },
    });
});

test('assigns the shopkeeper to the selected shop', async () => {
    const { Shop, shop, shopkeeper } = createMocks();

    await moveShopkeeperToShop({ Shop, shop, shopkeeper });

    assert.equal(shop.shopkeeperId, 'shopkeeper-1');
    assert.equal(shop.saveCalled, true);
});

test('populates shopkeeper details after assignment', async () => {
    const { Shop, shop, shopkeeper } = createMocks();

    await moveShopkeeperToShop({ Shop, shop, shopkeeper });

    assert.equal(shop.populateCalled, true);
    assert.equal(shop.populatedField, 'shopkeeperId');
    assert.equal(
        shop.populatedSelection,
        'name email collegeId role'
    );
});

test('returns the updated shop', async () => {
    const { Shop, shop, shopkeeper } = createMocks();

    const result = await moveShopkeeperToShop({
        Shop,
        shop,
        shopkeeper,
    });

    assert.equal(result, shop);
});