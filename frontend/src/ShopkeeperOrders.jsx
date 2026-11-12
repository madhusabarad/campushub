import { useEffect, useState } from 'react';
import {
  getIncomingOrders,
  updateFoodOrderStatus,
} from './api/shopkeeperOrderApi';

function ShopkeeperOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getIncomingOrders();
      setOrders(result.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load food orders.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const changeStatus = async (orderId, status) => {
    try {
      setError('');
      setMessage('');

      await updateFoodOrderStatus(orderId, status);

      setMessage('Order status updated successfully.');
      await loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to update order status.'
      );
    }
  };

  const getActions = (status) => {
    const actions = {
      placed: [{ label: 'Start Preparing', status: 'preparing' }],
      preparing: [{ label: 'Mark Ready', status: 'ready' }],
      ready: [{ label: 'Complete Order', status: 'completed' }],
    };

    return actions[status] || [];
  };

  if (loading) {
    return <p className="p-8">Loading food orders...</p>;
  }

  return (
    <div className="min-h-screen bg-[#f8f3ed] p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold text-[#7b1e1e]">
          Food Order Management
        </h1>

        <p className="mb-6 text-gray-600">
          View and manage incoming student food orders.
        </p>

        <button
          onClick={loadOrders}
          className="mb-5 rounded-lg bg-[#7b1e1e] px-4 py-2 text-white"
        >
          Refresh Orders
        </button>

        {message && (
          <p className="mb-4 text-green-700">{message}</p>
        )}

        {error && (
          <p className="mb-4 text-red-600">{error}</p>
        )}

        {orders.length === 0 ? (
          <p className="rounded-xl bg-white p-6">
            No food orders found.
          </p>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order._id}
                className="rounded-xl bg-white p-5 shadow"
              >
                <h2 className="mb-3 text-lg font-bold">
                  Order #{order._id?.slice(-6).toUpperCase()}
                </h2>

                <p>
                  <strong>Student:</strong>{' '}
                  {order.userId?.name || 'Student'}
                </p>

                <p>
                  <strong>Email:</strong>{' '}
                  {order.userId?.email || 'Not available'}
                </p>

                <p>
                  <strong>Status:</strong> {order.status}
                </p>

                <p>
                  <strong>Total:</strong> ₹
                  {order.totalAmount ?? order.totalPrice ?? order.total ?? '—'}
                </p>

                <p>
                  <strong>Order Date:</strong>{' '}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : 'Not available'}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {getActions(order.status).map((action) => (
                    <button
                      key={action.status}
                      onClick={() =>
                        changeStatus(order._id, action.status)
                      }
                      className="rounded-lg bg-[#7b1e1e] px-4 py-2 text-white"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShopkeeperOrders;