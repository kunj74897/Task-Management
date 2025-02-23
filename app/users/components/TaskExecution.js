'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TaskExecution({ task, onClose }) {
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (e, fieldName) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    setFiles(prev => ({ ...prev, [fieldName]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      
      // Add file fields
      Object.keys(files).forEach(fieldName => {
        submitData.append(fieldName, files[fieldName]);
      });
      
      // Add other form data
      Object.keys(formData).forEach(fieldName => {
        submitData.append(fieldName, formData[fieldName]);
      });

      const response = await fetch(`/api/tasks/${task._id}/submit`, {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) throw new Error('Failed to submit task');

      router.refresh();
      onClose();
    } catch (error) {
      setError('Error submitting task');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'string':
        return (
          <input
            type="text"
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(e, field.name)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            placeholder={`Enter ${field.name}`}
            required
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(e, field.name)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            placeholder={`Enter ${field.name}`}
            required
          />
        );
      case 'file':
        return (
          <input
            type="file"
            onChange={(e) => handleFileChange(e, field.name)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            required
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {task.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300">
                {task.description}
              </p>
            </div>

            {task.fields?.map((field, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.name}
                </label>
                {renderField(field)}
              </div>
            ))}

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Task'}
              </button>
            </div>
          </form>

          <div className="mt-4">
            <Link
              href={`/users/tasks/execute/${task._id}`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
            >
              Execute Task
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 