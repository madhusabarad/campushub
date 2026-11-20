import { useEffect, useState } from 'react';
import {
  getShopkeeperXeroxRequests,
  updateXeroxStatus,
  markXeroxPaymentPaid,
} from './api/shopkeeperXeroxApi';

function ShopkeeperXerox() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getShopkeeperXeroxRequests();
      setRequests(result.requests || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load Xerox requests.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const changeStatus = async (requestId, status) => {
    try {
      setMessage('');
      await updateXeroxStatus(requestId, status);
      setMessage('Request status updated successfully.');
      await loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to update request status.'
      );
    }
  };

  const markPayment = async (requestId) => {
    try {
      setMessage('');
      await markXeroxPaymentPaid(requestId);
      setMessage('Payment marked as paid.');
      await loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to update payment.'
      );
    }
  };

  const getNextAction = (request) => {
    const actions = {
      pending: [
        { label: 'Accept', status: 'accepted' },
        { label: 'Reject', status: 'rejected' },
      ],
      accepted: [{ label: 'Start Printing', status: 'printing' }],
      printing: [
        { label: 'Ready for Pickup', status: 'ready-for-pickup' },
      ],
      'ready-for-pickup': [
        { label: 'Complete', status: 'completed' },
      ],
    };

    return actions[request.status] || [];
  };

  if (loading) {
    return <p className="p-8 text-muted-text">Loading Xerox requests...</p>;
  }

  return (
    <div className="min-h-screen bg-background text-text p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold text-primary">
          Xerox Request Management
        </h1>

        <p className="mb-6 text-muted-text">
          View and manage student printing requests.
        </p>

        <button
          onClick={loadRequests}
          className="mb-5 rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 font-semibold text-white transition cursor-pointer"
        >
          Refresh Requests
        </button>

        {message && (
          <p className="mb-4 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">{message}</p>
        )}

        {error && (
          <p className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</p>
        )}

        {requests.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-6 text-muted-text">
            No Xerox requests found.
          </p>
        ) : (
          <div className="space-y-5">
            {requests.map((request) => (
              <div
                key={request._id}
                className="rounded-xl border border-border bg-surface p-5 shadow text-text"
              >
                <h2 className="mb-2 text-lg font-bold text-text">
                  Xerox Request
                </h2>

                <p className="text-muted-text">
                  <strong className="text-text">Request ID:</strong> #{request._id.slice(-6).toUpperCase()}
                </p>
                <p className="text-muted-text">
                  <strong className="text-text">Status:</strong>{' '}
                  <span className="capitalize font-semibold text-text">{request.status}</span>
                </p>
                <p className="text-muted-text">
                  <strong className="text-text">Copies:</strong> {request.numberOfCopies}
                </p>
                <p className="text-muted-text">
                  <strong className="text-text">Print Mode:</strong> {request.colorMode}
                </p>
                <p className="text-muted-text">
                  <strong className="text-text">Print Sides:</strong> {request.printSides}
                </p>
                <p className="text-muted-text">
                  <strong className="text-text">Paper Size:</strong> {request.paperSize}
                </p>
                <p className="text-muted-text">
                  <strong className="text-text">Estimated Price:</strong> <span className="font-bold text-primary">₹{request.estimatedPrice ?? request.totalPrice ?? '—'}</span>
                </p>
                <p className="text-muted-text">
                  <strong className="text-text">Payment Status:</strong>{' '}
                  <span className="capitalize font-semibold text-text">{request.paymentStatus || 'Not specified'}</span>
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {getNextAction(request).map((action) => (
                    <button
                      key={action.status}
                      onClick={() =>
                        changeStatus(request._id, action.status)
                      }
                      className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 font-semibold text-white transition cursor-pointer"
                    >
                      {action.label}
                    </button>
                  ))}

                  {request.status === 'completed' &&
                    request.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => markPayment(request._id)}
                        className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-4 py-2 font-semibold text-white transition cursor-pointer"
                      >
                        Mark Payment Paid
                      </button>
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

export default ShopkeeperXerox;
