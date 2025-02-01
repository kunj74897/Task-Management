'use client';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/app/actions/authActions';
import { acceptTask } from '@/app/actions/taskActions';

export default function NotificationDrawer({ isOpen, onClose, userId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchPendingTasks();
    }
  }, [isOpen, userId]);

  const fetchPendingTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/users/${userId}/pending-tasks`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }
      
      const data = await response.json();
      console.log('Fetched tasks:', data);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = async (taskId, action) => {
    try {
      if (action === 'accepted') {
        const result = await acceptTask(taskId, userId);
        if (result.success) {
          fetchPendingTasks();
        } else {
          throw new Error(result.error);
        }
      } else {
        // Handle rejection...
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out z-50">
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Task Notifications</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="overflow-y-auto h-full pb-20">
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No pending tasks</div>
        ) : (
          <div className="space-y-4 p-4">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{task.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {task.description}
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleTaskAction(task._id, 'rejected')}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleTaskAction(task._id, 'accepted')}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
