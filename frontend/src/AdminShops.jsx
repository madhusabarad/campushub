import { useEffect, useState } from 'react';
import {
  getAllShops,
  getAllUsers,
  assignShopkeeper,
} from './api/adminApi';

function AdminShops() {
  const [shops, setShops] = useState([]);
  const [shopkeepers, setShopkeepers] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [shopResult, userResult] = await Promise.all([
        getAllShops(),
        getAllUsers(),
      ]);

      setShops(shopResult.data || []);

      const availableShopkeepers = (userResult.data || []).filter(
        (user) => user.role === 'shopkeeper'
      );

      setShopkeepers(availableShopkeepers);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load shop information.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (shopId) => {
    const shopkeeperId = selected[shopId];

    if (!shopkeeperId) {
      setError('Please select a shopkeeper first.');
      return;
    }

    try {
      setError('');
      setMessage('');

      const result = await assignShopkeeper(shopId, shopkeeperId);

      setMessage(result.message || 'Shopkeeper assigned successfully.');
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to assign shopkeeper.'
      );
    }
  };

  if (loading) {
    return <p className="p-8 text-muted-text">Loading shops...</p>;
  }

  return (
    <div className="min-h-screen bg-background p-6 text-text">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-primary">
          Shop Management
        </h1>

        <p className="mb-6 text-muted-text">
          View shops and manage shopkeeper assignments.
        </p>

        <button
          onClick={loadData}
          className="mb-6 rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 font-medium text-white transition"
        >
          Refresh Shops
        </button>

        {message && (
          <p className="mb-4 text-emerald-700 dark:text-emerald-300">{message}</p>
        )}

        {error && (
          <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
        )}

        {shops.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-6 text-muted-text">No shops found.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {shops.map((shop) => (
              <div
                key={shop._id}
                className="rounded-xl border border-border bg-surface p-5 shadow text-text"
              >
                <h2 className="mb-2 text-xl font-bold text-primary">
                  {shop.name}
                </h2>

                <p className="text-muted-text">
                  <strong className="text-text">Category:</strong> {shop.category || '—'}
                </p>

                <p className="text-muted-text">
                  <strong className="text-text">Status:</strong>{' '}
                  <span className={shop.isOpen ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-rose-700 dark:text-rose-300 font-semibold'}>
                    {shop.isOpen ? 'Open' : 'Closed'}
                  </span>
                </p>

                <p className="mt-2 text-muted-text">
                  <strong className="text-text">Assigned Shopkeeper:</strong>{' '}
                  <span className="text-text font-medium">{shop.shopkeeperId?.name || 'Not assigned'}</span>
                </p>

                <p className="mb-4 text-sm text-muted-text">
                  {shop.shopkeeperId?.email || ''}
                </p>

                <label className="mb-2 block font-semibold text-text">
                  Select Shopkeeper
                </label>

                <select
                  value={selected[shop._id] || ''}
                  onChange={(e) =>
                    setSelected((previous) => ({
                      ...previous,
                      [shop._id]: e.target.value,
                    }))
                  }
                  className="mb-3 w-full rounded-lg border border-border bg-surface text-text p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Choose a shopkeeper</option>

                  {shopkeepers.map((person) => (
                    <option key={person._id} value={person._id}>
                      {person.name} ({person.email})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleAssign(shop._id)}
                  className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 font-medium text-white transition"
                >
                  Assign Shopkeeper
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminShops;
