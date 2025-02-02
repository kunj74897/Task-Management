'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { deleteTask } from '@/app/actions/taskActions';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      setError('Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      console.log('Updating status:', { taskId, newStatus });
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      console.log('Update response:', data);

      if (!response.ok) throw new Error('Failed to update status');
      fetchTasks();
    } catch (error) {
      console.error('Status update error:', error);
      setError('Error updating task status');
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');
      fetchTasks();
    } catch (error) {
      setError('Error deleting task');
    }
  };

  if (loading) return <div className="text-center py-4">Loading tasks...</div>;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard 
          key={task._id}
          task={task}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

function TaskCard({ task, onStatusChange, onDelete }) {
  const [currentStatus, setCurrentStatus] = useState(task.status);

  const handleStatusUpdate = async (e) => {
    const newStatus = e.target.value;
    setCurrentStatus(newStatus);
    await onStatusChange(task._id, newStatus);
  };

  // Update local state if task prop changes
  useEffect(() => {
    setCurrentStatus(task.status);
  }, [task.status]);

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      medium: 'bg-blue-50 text-blue-700 border-blue-200',
      high: 'bg-amber-50 text-amber-700 border-amber-200',
      urgent: 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-slate-50 text-slate-700 border-slate-200',
      'in-progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      completed: 'bg-teal-50 text-teal-700 border-teal-200'
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {task.title}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
        
        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
          {task.description}
        </p>
        
        {/* Assignment Info */}
        <div className="flex justify-between items-center mb-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Assigned to:</span>
          <span className="font-medium text-gray-900 dark:text-gray-200">
            {task.assignedTo?.username || task.assignedRole || 'Unassigned'}
          </span>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusColor(task.status)} inline-block`}>
            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </span>
        </div>

        {/* Actions Section */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div className="flex gap-3">
            <Link
              href={`/admin/tasks/edit/${task._id}`}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
            >
              Edit
            </Link>
            <button
              onClick={() => onDelete(task._id)}
              className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 text-sm font-medium"
            >
              Delete
            </button>
          </div>
          <select
            value={currentStatus}
            onChange={handleStatusUpdate}
            className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
} 