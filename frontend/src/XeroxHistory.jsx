import { useEffect, useState } from 'react';
import { getMyXeroxRequests } from './api/xeroxApi';

function XeroxHistory({ onBack }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const result = await getMyXeroxRequests();
        setRequests(result.requests || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Unable to load Xerox requests.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const statusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'ready-for-pickup':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f0e6] px-5 py-8 text-[#3f2720]">
      <div className="mx-auto max-w-5xl">

        <button
          type="button"
          onClick={onBack}
          className="mb-6 font-semibold text-[#7b1e1e]"
        >
          ← Back to Xerox
        </button>

        <h1 className="text-3xl font-bold text-[#7b1e1e]">
          My Xerox Requests
        </h1>

        <p className="mt-2 text-gray-500">
          Track your printing requests and their status.
        </p>

        {loading && (
          <p className="mt-8">Loading your requests...</p>
        )}

        {error && (
          <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-[#d9cabb] bg-white p-10 text-center">
            <p className="text-lg font-semibold">
              No Xerox requests yet
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Your submitted printing requests will appear here.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-5">
          {requests.map((request) => (
            <div
              key={request._id}
              className="rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">
                  Xerox Request
                </h2>

                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColor(request.status)}`}>
                  {request.status?.replaceAll('-', ' ')}
                </span>
              </div>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <p>
                  <strong>Pages:</strong> {request.totalPages}
                </p>

                <p>
                  <strong>Copies:</strong> {request.numberOfCopies}
                </p>

                <p>
                  <strong>Print mode:</strong> {request.colorMode}
                </p>

                <p>
                  <strong>Print sides:</strong> {request.printSides}
                </p>

                <p>
                  <strong>Paper size:</strong> {request.paperSize}
                </p>

                <p>
                  <strong>Payment:</strong> {request.paymentMethod}
                </p>

                <p>
                  <strong>Estimated price:</strong> ₹{request.estimatedPrice}
                </p>

                <p>
                  <strong>Payment status:</strong> {request.paymentStatus}
                </p>

                <p>
                  <strong>Requested on:</strong>{' '}
                  {new Date(request.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}

export default XeroxHistory;