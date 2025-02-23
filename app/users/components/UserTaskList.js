'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TaskExecution from './TaskExecution';

export default function UserTaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/users/assigned-tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      setError('Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\//g, '-');
  };

  const getPriorityBadgeStyle = (priority) => {
    const styles = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return styles[priority] || styles.medium;
  };

  if (loading) return <div className="text-center py-4">Loading tasks...</div>;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <div 
          key={task._id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {task.title}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeStyle(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className="text-gray-900 dark:text-gray-100">{task.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-gray-100">{formatDate(task.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Role:</span>
                <span className="text-gray-900 dark:text-gray-100">{task.assignedRole}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <Link
                href={`/users/tasks/execute/${task._id}`}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block text-center"
              >
                Execute Task
              </Link>
            </div>
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
          No tasks assigned
        </div>
      )}

      {selectedTask && (
        <TaskExecution
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={fetchTasks}
        />
      )}
    </div>
  );
} 