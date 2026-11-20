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
    <div className="min-h-screen bg-background p-6 text-text">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-primary">
          Order Management
        </h1>

        <p className="mb-6 text-muted-text">
          View food orders placed across all CampusHub outlets.
        </p>

        <button
          onClick={loadOrders}
          className="mb-6 rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 font-medium text-white transition"
        >
          Refresh Orders
        </button>

        {loading ? (
          <p className="text-muted-text">Loading orders...</p>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        ) : orders.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-6 text-muted-text">
            No orders found.
          </p>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order._id}
                className="rounded-xl border border-border bg-surface p-5 shadow text-text"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-primary">
                    Order #{order._id?.slice(-6).toUpperCase()}
                  </h2>

                  <span className="rounded-full border border-border bg-surface-muted px-3 py-1 text-sm font-semibold capitalize text-text">
                    {order.status || 'Unknown'}
                  </span>
                </div>

                <p className="text-muted-text">
                  <strong className="text-text">Student:</strong>{' '}
                  <span className="text-text">{order.userId?.name || 'Not available'}</span>
                </p>

                <p className="text-muted-text">
                  <strong className="text-text">Email:</strong>{' '}
                  <span className="text-text">{order.userId?.email || 'Not available'}</span>
                </p>

                <p className="text-muted-text">
                  <strong className="text-text">Shop:</strong>{' '}
                  <span className="text-text">{order.shopId?.name || 'Not available'}</span>
                </p>

                <p className="text-muted-text">
                  <strong className="text-text">Total:</strong>{' '}
                  <span className="font-bold text-primary">₹{order.totalAmount ?? '—'}</span>
                </p>

                <p className="text-muted-text">
                  <strong className="text-text">Date:</strong>{' '}
                  <span className="text-text">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : 'Not available'}
                  </span>
                </p>

                <div className="mt-3">
                  <strong className="text-text">Items:</strong>

                  {order.items?.length ? (
                    <ul className="mt-2 list-disc pl-6 space-y-1">
                      {order.items.map((item, index) => (
                        <li key={item.menuItemId || index} className="text-text">
                          {item.name} — <span className="text-muted-text">Quantity: {item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-muted-text">
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
