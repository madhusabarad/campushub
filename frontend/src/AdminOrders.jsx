import { useEffect, useState } from 'react';
import { getAllOrders } from './api/adminApi';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getAllOrders();
      setOrders(result.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load orders.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f3ed] p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-[#7b1e1e]">
          Order Management
        </h1>

        <p className="mb-6 text-gray-600">
          View food orders placed across all CampusHub outlets.
        </p>

        <button
          onClick={loadOrders}
          className="mb-6 rounded-lg bg-[#7b1e1e] px-4 py-2 text-white"
        >
          Refresh Orders
        </button>

        {loading ? (
          <p>Loading orders...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : orders.length === 0 ? (
          <p className="rounded-xl bg-white p-6">
            No orders found.
          </p>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order._id}
                className="rounded-xl bg-white p-5 shadow"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#7b1e1e]">
                    Order #{order._id?.slice(-6).toUpperCase()}
                  </h2>

                  <span className="rounded-full bg-[#f8f3ed] px-3 py-1 text-sm font-semibold capitalize">
                    {order.status || 'Unknown'}
                  </span>
                </div>

                <p>
                  <strong>Student:</strong>{' '}
                  {order.userId?.name || 'Not available'}
                </p>

                <p>
                  <strong>Email:</strong>{' '}
                  {order.userId?.email || 'Not available'}
                </p>

                <p>
                  <strong>Shop:</strong>{' '}
                  {order.shopId?.name || 'Not available'}
                </p>

                <p>
                  <strong>Total:</strong>{' '}
                  ₹{order.totalAmount ?? '—'}
                </p>

                <p>
                  <strong>Date:</strong>{' '}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : 'Not available'}
                </p>

                <div className="mt-3">
                  <strong>Items:</strong>

                  {order.items?.length ? (
                    <ul className="mt-2 list-disc pl-6">
                      {order.items.map((item, index) => (
                        <li key={item.menuItemId || index}>
                          {item.name} — Quantity: {item.quantity}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-gray-500">
                      Item details not available.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrders;