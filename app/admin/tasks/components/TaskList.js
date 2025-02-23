'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { deleteTask } from '@/app/actions/taskActions';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, roleFilter]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      setError('Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  // Add search handler with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

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

  const formatFieldValue = (field) => {
    if (!field.value) return 'N/A';
    
    switch (field.type) {
      case 'date':
        return new Date(field.value).toLocaleString();
      case 'file':
        return field.fileUrl ? (
          <a href={field.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            View File
          </a>
        ) : 'No file';
      case 'number':
        return Number(field.value).toLocaleString();
      default:
        return field.value.toString();
    }
  };

  const getStatusBadgeStyle = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return styles[status] || styles.pending;
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  const getAssignmentStatus = (task) => {
    // Use the actual assignmentStatus from the task model
    const status = task.assignmentStatus || 'pending';
    return {
      status: status,
      style: getAssignmentStatusStyle(status),
      text: status === 'accepted' ? 
        `Accepted: ${formatDate(task.assignmentAcceptedAt)}` : 
        status === 'rejected' ? 
        `Rejected: ${formatDate(task.assignmentRejectedAt)}` : 
        'Pending'
    };
  };

  const getAssignmentStatusStyle = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'accepted': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'in-review': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };
    return styles[status] || styles.pending;
  };

  if (loading) return <div className="text-center py-4">Loading tasks...</div>;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full md:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="salesman">Salesman</option>
            <option value="purchaseman">Purchaseman</option>
          </select>
        </div>
      </div>

      {/* Existing grid layout code */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div 
            key={task._id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            {/* Card Header */}
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {task.title}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeStyle(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {task.description}
              </p>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Assigned to:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {task.assignedTo?.map(user => user.username).join(', ') || task.assignedRole || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Assignment status:</span>
                <div className="flex flex-col items-end">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssignmentStatus(task).style}`}>
                    {getAssignmentStatus(task).status}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(task.status)}`}>
                  {task.status}
                </span>
              </div>

              {/* Created Date */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(task.createdAt)}
                </span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3">
              <Link
                href={`/admin/tasks/edit/${task._id}`}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(task._id)}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
            No tasks found
          </div>
        )}
      </div>
    </div>
  );
} 