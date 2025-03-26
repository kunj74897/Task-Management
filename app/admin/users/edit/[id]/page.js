'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import AlertMessage from '@/app/components/AlertMessage';

export default function EditUser({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    mobileNo: '',
    role: '',
    status: 'active',
    password: '',
    assignedTasks: []
  });

  const userId = use(params).id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) throw new Error('Failed to fetch user');
        const userData = await userResponse.json();

        // Fetch tasks assigned to this user
        const tasksResponse = await fetch(`/api/users/${userId}/assigned-tasks`);
        if (!tasksResponse.ok) throw new Error('Failed to fetch tasks');
        const tasksData = await tasksResponse.json();

        setTasks(tasksData);
        setFormData({
          username: userData.username,
          mobileNo: userData.mobileNo,
          role: userData.role,
          status: userData.status,
          password: '',
          assignedTasks: userData.assignedTasks || []
        });
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccess('User updated successfully!');
      
      // Navigate after a short delay to allow user to see success message
      setTimeout(() => {
        router.push('/admin/users');
        router.refresh();
      }, 2000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTaskToggle = (taskId) => {
    setFormData(prev => {
      const currentTasks = prev.assignedTasks || [];
      const newTasks = currentTasks.includes(taskId)
        ? currentTasks.filter(id => id !== taskId)
        : [...currentTasks, taskId];

      return {
        ...prev,
        assignedTasks: newTasks
      };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

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
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit User</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update user information and access control
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">User Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="tel"
                name="mobileNo"
                value={formData.mobileNo}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Access Control</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="salesman">Salesman</option>
                <option value="purchaseman">Purchaseman</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Assigned Tasks</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {tasks.map(task => (
              <div 
                key={task._id}
                className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {task.status}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={formData.assignedTasks?.includes(task._id)}
                    onChange={() => handleTaskToggle(task._id)}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                No tasks available
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Updating...' : 'Update User'}
          </button>
        </div>
      </form>
    </div>
  );
}