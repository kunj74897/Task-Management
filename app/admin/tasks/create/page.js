'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TaskForm from '../components/TaskForm';

export default function CreateTask() {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleSubmit = async (taskData) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create task');
      }

      router.push('/admin/tasks');
      router.refresh();
    } catch (error) {
      setError(error.message);
      return false;
    }
    return true;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Task</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Create a new task and assign it to users or roles</p>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <TaskForm onSubmit={handleSubmit} />
    </div>
  );
} 