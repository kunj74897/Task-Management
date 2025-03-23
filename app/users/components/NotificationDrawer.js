'use client';
import { useState, useEffect, useCallback } from 'react';
import { acceptTask } from '@/app/actions/taskActions';
import { useRouter } from 'next/navigation';

export default function NotificationDrawer({ isOpen, onClose, userId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasNewTasks, setHasNewTasks] = useState(false);
  const router = useRouter();

  console.log('NotificationDrawer render', { isOpen, userId });

  const fetchPendingTasks = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/users/${userId}/pending-tasks`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Set hasNewTasks to true if there are any pending tasks
        setHasNewTasks(data.length > 0);
        setTasks(data);
      } else {
        setTasks([]);
        setHasNewTasks(false);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPendingTasks();
    const pollInterval = setInterval(fetchPendingTasks, 5 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [fetchPendingTasks]);

  const handleTaskAction = async (taskId, action) => {
    if (action !== 'accepted') return;

    try {
      setError(null);
      const result = await acceptTask(taskId, userId);
      
      if (result.success) {
        setTasks(prevTasks => {
          const updatedTasks = prevTasks.filter(task => task._id !== taskId);
          // Update hasNewTasks based on remaining tasks
          setHasNewTasks(updatedTasks.length > 0);
          return updatedTasks;
        });
      } else {
        throw new Error(result.error || 'Failed to accept task');
      }
    } catch (error) {
      setError(error.message || 'Failed to update task');
    }
  };

  const handleClose = () => {
    setHasNewTasks(false);
    onClose();
    // Force a hard refresh of the page
    window.location.reload();
  };

  // Notify parent about new tasks
  useEffect(() => {
    if (window.parent) {
      window.parent.postMessage({ type: 'NOTIFICATION_STATUS', hasNewTasks }, '*');
    }
  }, [hasNewTasks]);

  if (!isOpen) return null;

  console.log('Rendering drawer content', { tasksCount: tasks.length });

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Task Notifications</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading && <div className="text-center py-4">Loading...</div>}
        {error && <div className="text-red-500 text-center py-2">{error}</div>}
        
        {!loading && tasks.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No pending tasks available
          </div>
        )}

        <div className="space-y-4">
          {!loading && tasks.map((task) => (
            <div key={task._id} className="border dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-medium mb-2">{task.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {task.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Priority: {task.priority}
                </span>
                <button
                  onClick={() => handleTaskAction(task._id, 'accepted')}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-md text-sm transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}