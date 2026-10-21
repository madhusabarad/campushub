
const buildRevenuePerShop = (shops, revenueRows) => {
    const revenueByShopId = new Map(
        revenueRows.map((row) => [
            String(row.shopId),
            row,
        ])
    );

    return shops
        .map((shop) => {
            const stats = revenueByShopId.get(String(shop._id));

            return {
                shopId: shop._id,
                shopName: shop.name,
                revenue: stats?.revenue || 0,
                orderCount: stats?.orderCount || 0,
            };
        })
        .sort(
            (a, b) =>
                b.revenue - a.revenue ||
                a.shopName.localeCompare(b.shopName)
        );
};

const buildPopularItems = (orders, limit = 10) => {
    const itemsByKey = new Map();

    for (const order of orders) {
        if (order.status === 'cancelled') {
            continue;
        }

        for (const item of order.items || []) {
            const key = `${String(item.menuItemId)}:${item.name}`;
            const existing = itemsByKey.get(key) || {
                menuItemId: item.menuItemId,
                name: item.name,
                quantitySold: 0,
                revenue: 0,
            };

            existing.quantitySold += item.quantity;
            existing.revenue += item.price * item.quantity;
            itemsByKey.set(key, existing);
        }
    }

    return [...itemsByKey.values()]
        .sort(
            (a, b) =>
                b.quantitySold - a.quantitySold ||
                a.name.localeCompare(b.name)
        )
        .slice(0, limit);
};

const buildDailyOrders = (orders) => {
    const counts = new Map();

    for (const order of orders) {
        if (!(order.createdAt instanceof Date)) {
            continue;
        }

        const date = order.createdAt.toISOString().slice(0, 10);
        counts.set(date, (counts.get(date) || 0) + 1);
    }

    return [...counts.entries()]
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, count]) => ({ date, count }));
};

module.exports = {
    buildRevenuePerShop,
    buildPopularItems,
    buildDailyOrders,
};
