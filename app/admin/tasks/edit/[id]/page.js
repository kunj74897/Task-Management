'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import TaskForm from '../../components/TaskForm';

export default function EditTask({ params }) {
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const taskId = use(params).id;

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch task');
        }
        const data = await response.json();
        
        const formattedTask = {
          ...data,
          customFields: data.fields?.map(field => ({
            label: field.label,
            type: field.type,
            value: field.type === 'date' ? 
              new Date(field.value).toISOString().slice(0, 16) : 
              field.value,
            required: field.required
          })) || [],
          assignType: data.assignedTo?.length > 0 ? 'user' : 'role',
          assignedTo: data.assignedTo?.length > 0 ? data.assignedTo[0]._id : '',
          assignedRole: data.assignedRole || '',
          previousAssignment: {
            type: data.assignedTo?.length > 0 ? 'user' : 'role',
            value: data.assignedTo?.length > 0 ? data.assignedTo[0]._id : data.assignedRole
          }
        };
        
        setTask(formattedTask);
      } catch (error) {
        setError('Error fetching task');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleSubmit = async (taskData) => {
    try {
      // Check if assignment has changed
      const hasAssignmentChanged = 
        taskData.assignType !== task.previousAssignment.type ||
        (taskData.assignType === 'user' && taskData.assignedTo !== task.previousAssignment.value) ||
        (taskData.assignType === 'role' && taskData.assignedRole !== task.previousAssignment.value);

      // If assignment changed, set assignmentStatus to pending
      const updatedTaskData = {
        ...taskData,
        assignmentStatus: hasAssignmentChanged ? 'pending' : task.assignmentStatus
      };

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTaskData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update task');
      }

      router.push('/admin/tasks');
      router.refresh();
      return true;
    } catch (error) {
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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Task</h1>
      {task && (
        <TaskForm
          initialData={task}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}