'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TaskForm({ onSubmit }) {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    assignType: 'user', // 'user' or 'role'
    assignedTo: '',
    assignedRole: '',
    priority: 'medium',
    notificationFrequency: 'daily',
    repeatNotification: false,
    dueDate: '',
    subTasks: []
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

  const addSubTask = () => {
    setTaskData(prev => ({
      ...prev,
      subTasks: [...prev.subTasks, { title: '', description: '', status: 'pending' }]
    }));
  };

  const handleSubTaskChange = (index, field, value) => {
    setTaskData(prev => ({
      ...prev,
      subTasks: prev.subTasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const removeSubTask = (index) => {
    setTaskData(prev => ({
      ...prev,
      subTasks: prev.subTasks.filter((_, i) => i !== index)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={taskData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Assign To</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="assignType"
                  value="user"
                  checked={taskData.assignType === 'user'}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span className="ml-2">User</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="assignType"
                  value="role"
                  checked={taskData.assignType === 'role'}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span className="ml-2">Role</span>
              </label>
            </div>

            {taskData.assignType === 'user' ? (
              <select
                name="assignedTo"
                value={taskData.assignedTo}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
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
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select Role</option>
                <option value="salesman">Salesman</option>
                <option value="purchaseman">Purchaseman</option>
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select
              name="priority"
              value={taskData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <input
              type="datetime-local"
              name="dueDate"
              value={taskData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={taskData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="button"
            onClick={addSubTask}
            className="text-blue-600 hover:text-blue-700"
          >
            + Add Subtask
          </button>
        </div>

        {taskData.subTasks.map((subtask, index) => (
          <div key={index} className="md:col-span-2 border p-4 rounded-md">
            <input
              type="text"
              placeholder="Subtask title"
              value={subtask.title}
              onChange={(e) => handleSubTaskChange(index, 'title', e.target.value)}
              className="w-full px-3 py-2 border rounded-md mb-2"
            />
            <textarea
              placeholder="Subtask description"
              value={subtask.description}
              onChange={(e) => handleSubTaskChange(index, 'description', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </form>
  );
} 