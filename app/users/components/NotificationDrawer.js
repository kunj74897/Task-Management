'use client';
import { useState, useEffect, useCallback } from 'react';
import { acceptTask } from '@/app/actions/taskActions';
import { useRouter } from 'next/navigation';

export default function NotificationDrawer({ isOpen, onClose, userId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  console.log('NotificationDrawer render', { isOpen, userId });

  const fetchPendingTasks = useCallback(async () => {
    console.log('fetchPendingTasks called', { isOpen, userId });
    if (!isOpen || !userId) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching tasks for user:', userId);
      const response = await fetch(`/api/users/${userId}/pending-tasks`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      console.log('Fetched tasks:', data);
      
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        console.warn('Received non-array data:', data);
        setTasks([]);
      }
    } catch (error) {
      console.error('Fetch error details:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isOpen, userId]);

  useEffect(() => {
    console.log('useEffect triggered', { isOpen, userId });
    if (isOpen && userId) {
      fetchPendingTasks();
    }
    
    return () => {
      console.log('Cleanup effect running');
      setTasks([]);
      setError(null);
    };
  }, [isOpen, userId, fetchPendingTasks]);

  const handleTaskAction = async (taskId, action) => {
    const debug = (msg, data = {}) => {
      console.log(`[handleTaskAction] ${msg}`, { timestamp: new Date().toISOString(), ...data });
    };

    debug('Action started', { taskId, action });
    if (action !== 'accepted') return;

    try {
      setError(null);
      debug('Calling acceptTask');
      const result = await acceptTask(taskId, userId);
      debug('acceptTask response', result);
      
      if (result.success) {
        debug('Task accepted successfully');
        setTasks(prevTasks => {
          const filteredTasks = prevTasks.filter(task => task._id !== taskId);
          debug('Tasks updated', { 
            previousCount: prevTasks.length,
            newCount: filteredTasks.length 
          });
          return filteredTasks;
        });
        
        // Delay the drawer close slightly to ensure state updates complete
        setTimeout(() => {
          debug('Closing drawer');
          onClose();
        }, 100);
      } else {
        debug('Task acceptance failed', { error: result.error });
        throw new Error(result.error || 'Failed to accept task');
      }
    } catch (error) {
      debug('Error caught', { error: error.message });
      setError(error.message || 'Failed to update task');
    }
  };

  if (!isOpen) return null;

  console.log('Rendering drawer content', { tasksCount: tasks.length });

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