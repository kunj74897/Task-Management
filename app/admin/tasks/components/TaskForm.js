'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TaskForm({ initialData, onSubmit }) {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [taskData, setTaskData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    assignType: initialData?.assignedTo ? 'user' : 'role',
    assignedTo: initialData?.assignedTo || '',
    assignedRole: initialData?.assignedRole || '',
    priority: initialData?.priority || 'medium',
    status: initialData?.status || 'pending',
    assignmentStatus: initialData?.assignmentStatus || 'pending',
    notificationType: initialData?.notificationFrequency?.type || 'once',
    notificationInterval: initialData?.notificationFrequency?.interval || 'daily',
    notificationHours: initialData?.notificationFrequency?.customInterval?.hours || 24,
    notificationMinutes: initialData?.notificationFrequency?.customInterval?.minutes || 0,
    notificationStartTime: initialData?.notificationFrequency?.startTime || '',
    notificationEndTime: initialData?.notificationFrequency?.endTime || '',
    repeatNotification: initialData?.repeatNotification || false,
    fields: initialData?.fields || [],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaskData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await onSubmit(taskData);
      if (success) {
        router.push('/admin/tasks');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    setTaskData(prev => ({
      ...prev,
      fields: [...prev.fields, { label: '', type: 'string', value: '', required: false }]
    }));
  };

  const handleFieldChange = (index, field, value) => {
    setTaskData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={taskData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                text-gray-900 dark:text-white
                bg-white dark:bg-gray-700
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              name="priority"
              value={taskData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                text-gray-900 dark:text-white
                bg-white dark:bg-gray-700
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={taskData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                text-gray-900 dark:text-white
                bg-white dark:bg-gray-700
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Assignment Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Assignment</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign To
            </label>
            <div className="flex items-center space-x-6 mb-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="assignType"
                  value="user"
                  checked={taskData.assignType === 'user'}
                  onChange={handleChange}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">User</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="assignType"
                  value="role"
                  checked={taskData.assignType === 'role'}
                  onChange={handleChange}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Role</span>
              </label>
            </div>

            {taskData.assignType === 'user' ? (
              <select
                name="assignedTo"
                value={taskData.assignedTo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                  text-gray-900 dark:text-white
                  bg-white dark:bg-gray-700
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select User</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.username}
                  </option>
                ))}
              </select>
            ) : (
              <select
                name="assignedRole"
                value={taskData.assignedRole}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                  text-gray-900 dark:text-white
                  bg-white dark:bg-gray-700
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Role</option>
                <option value="salesman">Salesman</option>
                <option value="purchaseman">Purchaseman</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Notification Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Type
            </label>
            <select
              name="notificationType"
              value={taskData.notificationType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                text-gray-900 dark:text-white
                bg-white dark:bg-gray-700
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="once">Once</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>

          {taskData.notificationType === 'recurring' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interval
                </label>
                <select
                  name="notificationInterval"
                  value={taskData.notificationInterval}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                    text-gray-900 dark:text-white
                    bg-white dark:bg-gray-700
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {taskData.notificationInterval === 'custom' && (
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hours
                    </label>
                    <input
                      type="number"
                      name="notificationHours"
                      value={taskData.notificationHours}
                      onChange={handleChange}
                      min="0"
                      max="23"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                        text-gray-900 dark:text-white
                        bg-white dark:bg-gray-700
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minutes
                    </label>
                    <input
                      type="number"
                      name="notificationMinutes"
                      value={taskData.notificationMinutes}
                      onChange={handleChange}
                      min="0"
                      max="59"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                        text-gray-900 dark:text-white
                        bg-white dark:bg-gray-700
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Custom Fields */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Custom Fields</h2>
          <button
            type="button"
            onClick={addField}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 
              dark:text-blue-400 dark:hover:text-blue-300"
          >
            + Add Field
          </button>
        </div>

        {taskData.fields.map((field, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Field Label"
              value={field.label}
              onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                text-gray-900 dark:text-white
                bg-white dark:bg-gray-700
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={field.type}
              onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                text-gray-900 dark:text-white
                bg-white dark:bg-gray-700
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="string">Text</option>
              <option value="number">Number</option>
              <option value="file">File</option>
            </select>
            <div className="flex items-center">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                  className="form-checkbox text-blue-600"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Required</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Saving...' : (initialData ? 'Update Task' : 'Create Task')}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
    </form>
  );
} 