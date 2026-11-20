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
        return 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300 dark:border dark:border-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 dark:border dark:border-red-800';
      case 'ready-for-pickup':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:border dark:border-blue-800';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:border dark:border-amber-800';
    }
  };

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-text">
      <div className="mx-auto max-w-5xl">

        <button
          type="button"
          onClick={onBack}
          className="mb-6 font-semibold text-primary hover:underline cursor-pointer"
        >
          ← Back to Xerox
        </button>

        <h1 className="text-3xl font-bold text-primary">
          My Xerox Requests
        </h1>

        <p className="mt-2 text-muted-text">
          Track your printing requests and their status.
        </p>

        {loading && (
          <p className="mt-8 text-muted-text">Loading your requests...</p>
        )}

        {error && (
          <p className="mt-8 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
            <p className="text-lg font-semibold text-text">
              No Xerox requests yet
            </p>
            <p className="mt-2 text-sm text-muted-text">
              Your submitted printing requests will appear here.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-5">
          {requests.map((request) => (
            <div
              key={request._id}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-text">
                  Xerox Request
                </h2>

                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColor(request.status)}`}>
                  {request.status?.replaceAll('-', ' ')}
                </span>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-text sm:grid-cols-2">
                <p>
                  <strong className="text-muted-text">Pages:</strong> {request.totalPages}
                </p>

                <p>
                  <strong className="text-muted-text">Copies:</strong> {request.numberOfCopies}
                </p>

                <p>
                  <strong className="text-muted-text">Print mode:</strong> {request.colorMode}
                </p>

                <p>
                  <strong className="text-muted-text">Print sides:</strong> {request.printSides}
                </p>

                <p>
                  <strong className="text-muted-text">Paper size:</strong> {request.paperSize}
                </p>

                <p>
                  <strong className="text-muted-text">Payment:</strong> {request.paymentMethod}
                </p>

                <p>
                  <strong className="text-muted-text">Estimated price:</strong> <span className="font-bold text-primary">₹{request.estimatedPrice}</span>
                </p>

                <p>
                  <strong className="text-muted-text">Payment status:</strong> {request.paymentStatus}
                </p>

                <p>
                  <strong className="text-muted-text">Requested on:</strong>{' '}
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
