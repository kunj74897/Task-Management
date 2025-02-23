'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function TaskExecutionPage({ params }) {
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const taskId = use(params).id;
  const fileInputRefs = useRef([]);

  // Phone input styles (copied from TaskForm)
  const phoneInputStyles = `
    .phone-input-container { @apply w-full; }
    .phone-input-container .PhoneInput { @apply flex items-center border rounded-lg overflow-hidden dark:border-gray-600; }
    .phone-input-container .PhoneInputCountry { @apply px-3 py-2 bg-gray-50 dark:bg-gray-700 border-r dark:border-gray-600; }
    .phone-input-container .PhoneInputInput { 
      @apply px-4 py-2 flex-1 border-0 focus:ring-0 dark:bg-gray-700 dark:text-white;
      outline: none !important;
    }
  `;

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) throw new Error('Failed to fetch task');
      const data = await response.json();
      setTask(data);
      
      // Initialize form data based on field types
      const initialData = {};
      data.fields?.forEach(field => {
        if (field.type === 'date') {
          initialData[field.label] = field.value ? new Date(field.value).toISOString().slice(0, 16) : '';
        } else if (field.type !== 'file') {
          initialData[field.label] = field.value || '';
        }
      });
      setFormData(initialData);
    } catch (error) {
      setError('Error fetching task');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, field) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      [field.label]: value
    }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    setFiles(prev => ({
      ...prev,
      [field.label]: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      
      // Add file fields
      Object.entries(files).forEach(([fieldName, file]) => {
        submitData.append(fieldName, file);
      });
      
      // Add other form data
      Object.entries(formData).forEach(([fieldName, value]) => {
        submitData.append(fieldName, value);
      });

      const response = await fetch(`/api/tasks/${taskId}/submit`, {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) throw new Error('Failed to submit task');
      router.push('/users/tasks');
      router.refresh();
    } catch (error) {
      setError('Error submitting task');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field, index) => {
    switch (field.type) {
      case 'number':
        return (
          <div className="phone-input-container">
            <PhoneInput
              international
              countryCallingCodeEditable={false}
              defaultCountry="US"
              value={formData[field.label] || ''}
              onChange={(value) => handlePhoneNumberChange(value, field.label)}
              className="w-full dark:bg-gray-700 dark:text-white"
            />
          </div>
        );
      case 'date':
        return (
          <input
            type="datetime-local"
            value={formData[field.label] || ''}
            onChange={(e) => handleInputChange(e, field)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        );
      case 'file':
        return (
          <>
            <input
              type="file"
              ref={el => fileInputRefs.current[index] = el}
              onChange={(e) => handleFileChange(e, field)}
              className="hidden"
              required={field.required}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRefs.current[index]?.click()}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Choose File
              </button>
              {files[field.label] && (
                <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  {files[field.label].name}
                </span>
              )}
            </div>
          </>
        );
      default:
        return (
          <input
            type="text"
            value={formData[field.label] || ''}
            onChange={(e) => handleInputChange(e, field)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        );
    }
  };

  const handlePhoneNumberChange = (value, fieldLabel) => {
    setFormData(prev => ({
      ...prev,
      [fieldLabel]: value
    }));
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>;

  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;

  if (!task) return <div className="text-center py-4">Task not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <style>{phoneInputStyles}</style>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{task.title}</h1>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <p className="text-gray-700 dark:text-gray-300">{task.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {task.fields?.map((field, index) => (
            <div key={index} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              {renderField(field, index)}
            </div>
          ))}

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
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
      </div>
    </div>
  );
} 