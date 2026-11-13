import { useEffect, useMemo, useState } from 'react';

const API_BASE = '/api';

const SHOP_CONFIG = {
  '1': {
    name: 'Campus Canteen',
    expectedCount: 30,
  },
  '2': {
    name: 'Akshay Food Court',
    expectedCount: 147,
  },
  '3': {
    name: 'Campus Bakery',
    expectedCount: 12,
  },
};

function getToken() {
  return (
    localStorage.getItem('campushub_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    ''
  );
}

async function apiRequest(url) {
  const token = getToken();

  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || 'Unable to load menu.');
  }

  return result;
}

async function fetchAllMenuItems(shopId) {
  const firstPage = await apiRequest(
    `/shops/${shopId}/menu?page=1&limit=100`
  );

  const items = [...(firstPage.data || [])];
  const totalPages = firstPage.pagination?.totalPages || 1;

  for (let page = 2; page <= totalPages; page++) {
    const result = await apiRequest(
      `/shops/${shopId}/menu?page=${page}&limit=100`
    );

    items.push(...(result.data || []));
  }

  return items;
}

export default function Menu({ shopId, onBack }) {
  const shopKey = String(shopId || '1');
  const currentShop = SHOP_CONFIG[shopKey];

  const [selectedShop, setSelectedShop] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      try {
        setLoading(true);
        setError('');
        setMenuItems([]);
        setSelectedShop(null);
        setActiveCategory('All');

        if (!currentShop) {
          throw new Error('Invalid shop selection.');
        }

        const shopResult = await apiRequest('/shops?limit=100');
        const allShops = shopResult.data || [];

        const matchedShop = allShops.find(
          shop =>
            shop.name?.trim().toLowerCase() ===
            currentShop.name.trim().toLowerCase()
        );

        if (!matchedShop) {
          throw new Error(
            `${currentShop.name} was not found in the database.`
          );
        }

        if (cancelled) return;

        setSelectedShop(matchedShop);

        const items = await fetchAllMenuItems(matchedShop._id);

        if (cancelled) return;

        const correctShopItems = items.filter(item => {
          const itemShopId = item.shopId?._id || item.shopId;
          return String(itemShopId) === String(matchedShop._id);
        });

        setMenuItems(correctShopItems);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load menu.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, [shopKey]);

  const categories = useMemo(
    () => [
      'All',
      ...new Set(
        menuItems
          .map(item => item.category?.trim())
          .filter(Boolean)
      ),
    ],
    [menuItems]
  );

  const filteredItems = useMemo(
    () =>
      activeCategory === 'All'
        ? menuItems
        : menuItems.filter(
            item => item.category?.trim() === activeCategory
          ),
    [menuItems, activeCategory]
  );

  function addToCart(item) {
    if (item.isAvailable === false) return;

    setCart(previous => {
      const existing = previous.find(
        cartItem => cartItem._id === item._id
      );

      if (existing) {
        return previous.map(cartItem =>
          cartItem._id === item._id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      return [...previous, { ...item, quantity: 1 }];
    });
  }

  function changeQuantity(id, change) {
    setCart(previous =>
      previous
        .map(item =>
          item._id === id
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">
        Loading menu items...
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 rounded-lg bg-red-50 p-5 text-red-700">
        <p>{error}</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-white"
        >
          Back to Shops
        </button>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <button
          onClick={onBack}
          className="mb-5 text-sm font-semibold text-orange-700 hover:underline"
        >
          ← Back to Shops
        </button>

        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
          CampusHub Menu
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          {selectedShop?.name}
        </h1>

        <p className="mt-2 text-gray-600">
          Browse available items and add them to your cart.
        </p>

        <p className="mt-3 text-sm text-gray-500">
          {menuItems.length} menu items available
        </p>

        {currentShop &&
          menuItems.length !== currentShop.expectedCount && (
            <p className="mt-2 text-sm text-amber-700">
              Expected {currentShop.expectedCount} items, but received{' '}
              {menuItems.length}.
            </p>
          )}
      </header>

      <section className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium ${
                activeCategory === category
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-orange-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map(item => (
          <article
            key={item._id}
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900">
                {item.name}
              </h2>

              <p className="mt-1 font-bold text-orange-600">
                ₹{item.price}
              </p>
            </div>

            {item.isAvailable === false ? (
              <span className="shrink-0 text-sm text-red-600">
                Unavailable
              </span>
            ) : (
              <button
                onClick={() => addToCart(item)}
                className="shrink-0 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Add +
              </button>
            )}
          </article>
        ))}
      </section>

      {filteredItems.length === 0 && (
        <p className="py-12 text-center text-gray-500">
          No items found in this category.
        </p>
      )}

      {cartCount > 0 && (
        <aside className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-xl bg-gray-900 p-4 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">
                {cartCount} items in cart
              </p>

              <p className="text-sm text-gray-300">
                Total: ₹{cartTotal}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {cart.map(item => (
                <div
                  key={item._id}
                  className="flex items-center gap-2 rounded-lg bg-gray-700 px-2 py-1 text-sm"
                >
                  <span>{item.name}</span>

                  <button
                    onClick={() => changeQuantity(item._id, -1)}
                    aria-label={`Remove one ${item.name}`}
                  >
                    −
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() => changeQuantity(item._id, 1)}
                    aria-label={`Add one ${item.name}`}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </main>
  );
}