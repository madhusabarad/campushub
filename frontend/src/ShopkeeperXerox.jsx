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
    return <p className="p-8">Loading Xerox requests...</p>;
  }

  return (
    <div className="min-h-screen bg-[#f8f3ed] p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold text-[#7b1e1e]">
          Xerox Request Management
        </h1>

        <p className="mb-6 text-gray-600">
          View and manage student printing requests.
        </p>

        <button
          onClick={loadRequests}
          className="mb-5 rounded-lg bg-[#7b1e1e] px-4 py-2 text-white"
        >
          Refresh Requests
        </button>

        {message && (
          <p className="mb-4 text-green-700">{message}</p>
        )}

        {error && (
          <p className="mb-4 text-red-600">{error}</p>
        )}

        {requests.length === 0 ? (
          <p className="rounded-xl bg-white p-6">
            No Xerox requests found.
          </p>
        ) : (
          <div className="space-y-5">
            {requests.map((request) => (
              <div
                key={request._id}
                className="rounded-xl bg-white p-5 shadow"
              >
                <h2 className="mb-2 text-lg font-bold">
                  Xerox Request
                </h2>

                <p>
                  <strong>Request ID:</strong> #{request._id.slice(-6).toUpperCase()}
                </p>
                <p>
                  <strong>Status:</strong> {request.status}
                </p>
                <p>
                  <strong>Copies:</strong> {request.numberOfCopies}
                </p>
                <p>
                  <strong>Print Mode:</strong> {request.colorMode}
                </p>
                <p>
                  <strong>Print Sides:</strong> {request.printSides}
                </p>
                <p>
                  <strong>Paper Size:</strong> {request.paperSize}
                </p>
                <p>
                  <strong>Estimated Price:</strong> ₹
                  {request.estimatedPrice ?? request.totalPrice ?? '—'}
                </p>
                <p>
                  <strong>Payment Status:</strong>{' '}
                  {request.paymentStatus || 'Not specified'}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {getNextAction(request).map((action) => (
                    <button
                      key={action.status}
                      onClick={() =>
                        changeStatus(request._id, action.status)
                      }
                      className="rounded-lg bg-[#7b1e1e] px-4 py-2 text-white"
                    >
                      {action.label}
                    </button>
                  ))}

                  {request.status === 'completed' &&
                    request.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => markPayment(request._id)}
                        className="rounded-lg bg-green-700 px-4 py-2 text-white"
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