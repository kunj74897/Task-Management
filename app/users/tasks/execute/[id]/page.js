'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import TaskExecutionForm from '../../components/TaskExecutionForm';

export default function ExecuteTaskPage({ params }) {
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const taskId = use(params).id;

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch task');
        }
        const data = await response.json();
        setTask(data);
      } catch (error) {
        setError('Error fetching task: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleSubmit = async (submissionData) => {
    try {
      // First, create a PATCH request to update the task fields
      // This ensures the file URLs are saved properly
      const jsonResponse = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: submissionData.fields,
          status: 'completed'
        })
      });

      if (!jsonResponse.ok) {
        const errorData = await jsonResponse.json();
        throw new Error(errorData.error || 'Failed to save task data');
      }

      // After fields are saved, we can then mark it as completed
      const formData = new FormData();
      formData.append('status', 'completed');
      
      const completeResponse = await fetch(`/api/tasks/${taskId}/execute`, {
        method: 'POST',
        body: formData
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Failed to complete task');
      }

      router.push('/users');
      return true;
    } catch (error) {
      console.error("Error in task submission:", error);
      setError(error.message);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
        <p className="text-red-600 dark:text-red-200">{error}</p>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const initialData = {
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    customFields: task.fields?.map(field => ({
      label: field.label,
      type: field.type,
      value: field.value || '',
      required: field.required,
      fileUrl: field.type === 'file' ? field.value : null,
      fileName: field.type === 'file' && field.value ? field.value.split('/').pop() : null
    })) || []
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Execute Task</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Complete the required information below
        </p>
      </div>

      <TaskExecutionForm initialData={initialData} onSubmit={handleSubmit} />
    </div>
  );
} 