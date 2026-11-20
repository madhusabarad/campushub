import { useEffect, useState } from 'react';
import { getAllUsers } from './api/adminApi';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getAllUsers();
      setUsers(result.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load users.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 text-text">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-primary">
          User Management
        </h1>

        <p className="mb-6 text-muted-text">
          View registered students and shopkeepers.
        </p>

        <button
          onClick={loadUsers}
          className="mb-6 rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 font-medium text-white transition"
        >
          Refresh Users
        </button>

        {loading ? (
          <p className="text-muted-text">Loading users...</p>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        ) : users.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-6 text-muted-text">
            No users found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow">
            <table className="w-full text-left">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">College ID</th>
                  <th className="p-4">Role</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-border hover:bg-surface-hover transition">
                    <td className="p-4 font-medium text-text">{user.name}</td>
                    <td className="p-4 text-muted-text">{user.email}</td>
                    <td className="p-4 text-muted-text">
                      {user.collegeId || '—'}
                    </td>
                    <td className="p-4 capitalize text-text">
                      {user.role}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
