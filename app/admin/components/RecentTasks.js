'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RecentTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentTasks();
  }, []);

  const fetchRecentTasks = async () => {
    try {
      const response = await fetch('/api/tasks?limit=3&sort=-createdAt');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching recent tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  const getStatusBadgeStyle = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return styles[status] || styles.pending;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Tasks</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Tasks</h2>
        <Link 
          href="/admin/tasks"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div 
            key={task._id}
            className="border dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Link 
                  href={`/admin/tasks/edit/${task._id}`}
                  className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {task.title}
                </Link>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(task.createdAt)}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(task.status)}`}>
                {task.status}
              </span>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            No tasks found
          </div>
        )}
      </div>
    </div>
  );
} 