'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TaskForm from '../components/TaskForm';
import AlertMessage from '@/app/components/AlertMessage';

export default function CreateTask() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (taskData) => {
    try {
      // Format notification settings before sending
      const formattedData = {
        ...taskData,
        notificationFrequency: {
          type: taskData.notificationType,
          interval: taskData.notificationInterval,
          customInterval: {
            hours: parseInt(taskData.notificationHours) || 24,
            minutes: parseInt(taskData.notificationMinutes) || 0
          },
          startTime: taskData.notificationStartTime,
          endTime: taskData.notificationEndTime
        }
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create task');
      }

      setSuccess('Task created successfully!');
      
      // Navigate after a short delay to allow user to see success message
      setTimeout(() => {
        router.push('/admin/tasks');
        router.refresh();
      }, 2000);
      
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Task</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create a new task with notifications and custom fields
        </p>
      </div>

      <TaskForm onSubmit={handleSubmit} />
    </div>
  );
} 