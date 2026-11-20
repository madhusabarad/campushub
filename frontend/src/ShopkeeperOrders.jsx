import { useEffect, useState } from 'react';
import {
  getIncomingOrders,
  updateFoodOrderStatus,
  updateOrderPayment,
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

  const changePayment = async (orderId, action) => {
    let reason = '';
    if (action === 'reject') {
      reason = window.prompt('Please enter rejection reason:');
      if (reason === null) return;
      if (!reason.trim()) reason = 'Invalid payment proof';
    }

    try {
      setError('');
      setMessage('');

      await updateOrderPayment(orderId, action, reason);

      setMessage(`Payment ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully.`);
      await loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to update payment status.'
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
                  <strong>Payment Method:</strong>{' '}
                  <span className="capitalize">{order.paymentMethod === 'upi' ? 'UPI' : order.paymentMethod === 'razorpay' ? 'Razorpay' : 'Pay at Counter'}</span>
                </p>

                <p>
                  <strong>Payment Status:</strong>{' '}
                  <span className="font-semibold uppercase text-xs">
                    {order.paymentStatus === 'pending_verification' ? 'Pending Verification' : order.paymentStatus || 'Unpaid'}
                  </span>
                </p>

                {order.paymentMethod === 'upi' && (
                  <div className="my-2 rounded border border-gray-200 bg-gray-50 p-2 text-xs">
                    <p><strong>UTR:</strong> {order.paymentUtr || 'Not provided'}</p>
                    {order.paymentRejectReason && (
                      <p className="text-red-600"><strong>Reason:</strong> {order.paymentRejectReason}</p>
                    )}
                    {order.paymentProof && (
                      <p className="mt-1">
                        <a
                          href={order.paymentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#7b1e1e] underline font-semibold"
                        >
                          View Payment Proof Screenshot
                        </a>
                      </p>
                    )}
                    {order.paymentStatus === 'pending_verification' && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => changePayment(order._id, 'confirm')}
                          className="rounded bg-emerald-700 px-3 py-1 font-bold text-white text-xs"
                        >
                          Confirm Payment
                        </button>
                        <button
                          type="button"
                          onClick={() => changePayment(order._id, 'reject')}
                          className="rounded bg-rose-700 px-3 py-1 font-bold text-white text-xs"
                        >
                          Reject Payment
                        </button>
                      </div>
                    )}
                  </div>
                )}

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