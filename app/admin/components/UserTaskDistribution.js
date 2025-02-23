'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function UserTaskDistribution({ users }) {
  const [taskStats, setTaskStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskStats();
  }, [users]);

  const fetchTaskStats = async () => {
    try {
      const response = await fetch('/api/tasks/stats/users');
      const data = await response.json();
      
      // Combine user data with task stats
      const statsWithUserInfo = users.map(user => {
        const userStats = data.find(stat => stat._id === user._id) || {
          pending: 0,
          completed: 0,
          total: 0
        };
        return {
          ...user,
          stats: userStats
        };
      }).slice(0, 5); // Show only top 5 users

      setTaskStats(statsWithUserInfo);
    } catch (error) {
      console.error('Error fetching task stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = (stats) => {
    if (!stats.total) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Task Distribution</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Task Distribution</h2>
        <Link 
          href="/admin/users"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="space-y-4">
        {taskStats.map((user) => (
          <div key={user._id} className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {user.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{user.role}</div>
              </div>
            </div>
            <div className="flex space-x-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-yellow-600 dark:text-yellow-400">{user.stats.inProgress || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">inProgress</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600 dark:text-green-400">{user.stats.completed || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
              </div>
            </div>
          </div>
        ))}
        {taskStats.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            No users found
          </div>
        )}
      </div>
    </div>
  );
} 