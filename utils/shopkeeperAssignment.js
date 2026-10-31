const moveShopkeeperToShop = async ({ Shop, shop, shopkeeper }) => {
    await Shop.updateMany(
        {
            shopkeeperId: shopkeeper._id,
            _id: { $ne: shop._id },
        },
        {
            $set: { shopkeeperId: null },
        }
    );

    shop.shopkeeperId = shopkeeper._id;

    await shop.save();

    await shop.populate(
        'shopkeeperId',
        'name email collegeId role'
    );

    return shop;
};

module.exports = { moveShopkeeperToShop };