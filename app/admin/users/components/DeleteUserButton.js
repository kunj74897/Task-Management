'use client';

import { useState } from 'react';
import { deleteUser } from '@/app/actions/userActions';
import AlertMessage from '@/app/components/AlertMessage';

export default function DeleteUserButton({ userId, onSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this user?')) {
      setIsDeleting(true);
      try {
        const result = await deleteUser(userId);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete user');
        }
        setSuccess('User deleted successfully');
        if (onSuccess) setTimeout(onSuccess, 2000);
      } catch (error) {
        console.error('Error deleting user:', error);
        setError(error.message || 'Failed to delete user');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
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
      
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </>
  );
} 