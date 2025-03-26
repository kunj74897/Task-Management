'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DeleteUserButton from './components/DeleteUserButton';
import AlertMessage from '@/app/components/AlertMessage';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add debounce effect for search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch users whenever filters change
  useEffect(() => {
    fetchUsers();
  }, [debouncedSearchTerm, roleFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query params for API filtering
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      
      const response = await fetch(`/api/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, roleFilter]);

  const handleUserDeleted = () => {
    setSuccess('User has been deleted');
    fetchUsers();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
      {error && (
        <AlertMessage 
          message={error} 
          type="error" 
          onClose={() => setError("")} 
        />
      )}
      
      {success && (
        <AlertMessage 
          message={success} 
          type="success" 
          onClose={() => setSuccess("")} 
        />
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users Management</h1>
        <Link 
          href="/admin/users/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add User
        </Link>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by username or mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="salesman">Salesman</option>
            <option value="purchaseman">Purchaseman</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No users found matching your criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xl font-medium text-gray-600 dark:text-gray-300">
                            {user.username[0].toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.mobileNo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3">
                      <Link
                        href={`/admin/users/edit/${user._id}`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Edit
                      </Link>
                      <DeleteUserButton 
                        userId={user._id} 
                        onSuccess={handleUserDeleted} 
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getRoleColor(role) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'salesman':
      return 'bg-blue-100 text-blue-800';
    case 'purchaseman':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 