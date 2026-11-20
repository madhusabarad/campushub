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
    return <p className="p-8 text-muted-text">Loading food orders...</p>;
  }

  return (
    <div className="min-h-screen bg-background text-text p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold text-primary">
          Food Order Management
        </h1>

        <p className="mb-6 text-muted-text">
          View and manage incoming student food orders.
        </p>

        <button
          onClick={loadOrders}
          className="mb-5 rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 font-semibold text-white transition cursor-pointer"
        >
          Refresh Orders
        </button>

        {message && (
          <p className="mb-4 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">{message}</p>
        )}

        {error && (
          <p className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</p>
        )}

        {orders.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-6 text-muted-text">
            No food orders found.
          </p>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order._id}
                className="rounded-xl border border-border bg-surface p-5 shadow text-text"
              >
                <h2 className="mb-3 text-lg font-bold text-text">
                  Order #{order._id?.slice(-6).toUpperCase()}
                </h2>

                <p className="text-muted-text">
                  <strong className="text-text">Student:</strong>{' '}
                  {order.userId?.name || 'Student'}
                </p>

                <p className="text-muted-text">
                  <strong className="text-text">Email:</strong>{' '}
                  {order.userId?.email || 'Not available'}
                </p>

                <p className="text-muted-text">
                  <strong className="text-text">Status:</strong>{' '}
                  <span className="capitalize font-semibold text-text">{order.status}</span>
                </p>

                <p className="text-muted-text">
                  <strong className="text-text">Payment Method:</strong>{' '}
                  <span className="capitalize text-text">{order.paymentMethod === 'upi' ? 'UPI' : order.paymentMethod === 'razorpay' ? 'Razorpay' : 'Pay at Counter'}</span>
                </p>

                <p className="text-muted-text">
                  <strong className="text-text">Payment Status:</strong>{' '}
                  <span className="font-semibold uppercase text-xs text-text">
                    {order.paymentStatus === 'pending_verification' ? 'Pending Verification' : order.paymentStatus || 'Unpaid'}
                  </span>
                </p>

                {order.paymentMethod === 'upi' && (
                  <div className="my-2 rounded-xl border border-border bg-surface-muted/30 p-3 text-xs text-text">
                    <p><strong className="text-muted-text">UTR:</strong> <span className="font-mono font-semibold">{order.paymentUtr || 'Not provided'}</span></p>
                    {order.paymentRejectReason && (
                      <p className="text-danger mt-1"><strong>Reason:</strong> {order.paymentRejectReason}</p>
                    )}
                    {order.paymentProof && (
                      <p className="mt-1.5">
                        <a
                          href={order.paymentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline font-semibold hover:opacity-90"
                        >
                          View Payment Proof Screenshot ↗
                        </a>
                      </p>
                    )}
                    {order.paymentStatus === 'pending_verification' && (
                      <div className="mt-2.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => changePayment(order._id, 'confirm')}
                          className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 font-bold text-white text-xs cursor-pointer"
                        >
                          Confirm Payment
                        </button>
                        <button
                          type="button"
                          onClick={() => changePayment(order._id, 'reject')}
                          className="rounded-lg bg-rose-700 hover:bg-rose-800 px-3 py-1.5 font-bold text-white text-xs cursor-pointer"
                        >
                          Reject Payment
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-muted-text mt-2">
                  <strong className="text-text">Total:</strong> <span className="font-bold text-primary">₹{order.totalAmount ?? order.totalPrice ?? order.total ?? '—'}</span>
                </p>

                <p className="text-muted-text">
                  <strong className="text-text">Order Date:</strong>{' '}
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
                      className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 font-semibold text-white transition cursor-pointer"
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
