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
    return <p className="p-8">Loading shops...</p>;
  }

  return (
    <div className="min-h-screen bg-[#f8f3ed] p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-[#7b1e1e]">
          Shop Management
        </h1>

        <p className="mb-6 text-gray-600">
          View shops and manage shopkeeper assignments.
        </p>

        <button
          onClick={loadData}
          className="mb-6 rounded-lg bg-[#7b1e1e] px-4 py-2 text-white"
        >
          Refresh Shops
        </button>

        {message && (
          <p className="mb-4 text-green-700">{message}</p>
        )}

        {error && (
          <p className="mb-4 text-red-600">{error}</p>
        )}

        {shops.length === 0 ? (
          <p className="rounded-xl bg-white p-6">No shops found.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {shops.map((shop) => (
              <div
                key={shop._id}
                className="rounded-xl bg-white p-5 shadow"
              >
                <h2 className="mb-2 text-xl font-bold text-[#7b1e1e]">
                  {shop.name}
                </h2>

                <p>
                  <strong>Category:</strong> {shop.category || '—'}
                </p>

                <p>
                  <strong>Status:</strong>{' '}
                  {shop.isOpen ? 'Open' : 'Closed'}
                </p>

                <p className="mt-2">
                  <strong>Assigned Shopkeeper:</strong>{' '}
                  {shop.shopkeeperId?.name || 'Not assigned'}
                </p>

                <p className="mb-4 text-sm text-gray-600">
                  {shop.shopkeeperId?.email || ''}
                </p>

                <label className="mb-2 block font-semibold">
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
                  className="mb-3 w-full rounded-lg border p-2"
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
                  className="rounded-lg bg-[#7b1e1e] px-4 py-2 text-white"
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