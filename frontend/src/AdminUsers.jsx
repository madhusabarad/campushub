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
    <div className="min-h-screen bg-[#f8f3ed] p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-[#7b1e1e]">
          User Management
        </h1>

        <p className="mb-6 text-gray-600">
          View registered students and shopkeepers.
        </p>

        <button
          onClick={loadUsers}
          className="mb-6 rounded-lg bg-[#7b1e1e] px-4 py-2 text-white"
        >
          Refresh Users
        </button>

        {loading ? (
          <p>Loading users...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : users.length === 0 ? (
          <p className="rounded-xl bg-white p-6">
            No users found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-white shadow">
            <table className="w-full text-left">
              <thead className="bg-[#7b1e1e] text-white">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">College ID</th>
                  <th className="p-4">Role</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b">
                    <td className="p-4">{user.name}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      {user.collegeId || '—'}
                    </td>
                    <td className="p-4 capitalize">
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