'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function TaskForm({ initialData, onSubmit }) {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [taskData, setTaskData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
   customFields: initialData?.customFields?.map(field => ({
      ...field,
      fileUrl: field.type === 'file' ? field.value : null,
      fileName: field.type === 'file' && field.value ? field.value.split('/').pop() : null
    })) || [
      { label: '', type: 'string', value: '', required: false }
    ]
  });

  const fileInputRefs = useRef([]);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Add new state for tracking unsaved changes and temporary files
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [tempFiles, setTempFiles] = useState({});

  

  const handleCustomFieldChange = (index, field, value) => {
    setTaskData(prev => {
      const updatedFields = [...prev.customFields];
      if (field === 'type' && value === 'number') {
        updatedFields[index] = { 
          ...updatedFields[index], 
          [field]: value,
          value: '' 
        };
      } else {
        updatedFields[index] = { ...updatedFields[index], [field]: value };
      }
      return { ...prev, customFields: updatedFields };
    });
  };  

  const handlePhoneNumberChange = (value, index) => {
    setTaskData(prev => {
      const updatedFields = [...prev.customFields];
      updatedFields[index] = { 
        ...updatedFields[index], 
        value: value || '' 
      };
      return { ...prev, customFields: updatedFields };
    });
  };

  const handleCustomFieldDateChange = (index, value) => {
    setTaskData(prev => {
      const updatedFields = [...prev.customFields];
      updatedFields[index] = { 
        ...updatedFields[index], 
        value: value ? new Date(value).toISOString() : null 
      };
      return { ...prev, customFields: updatedFields };
    });
  };

  

  // Modify handleFileUpload to store temporary files without deleting previous ones
  const handleFileUpload = async (index, file) => {
    if (!file) return;

    setLoading(true);
    try {
      const previousFileUrl = taskData.customFields[index].fileUrl;

      // Find the matching field in initialData by label to handle multiple file fields
      const isOriginalFile = Boolean(
        initialData?.customFields?.find(
          (field, i) => 
            field.type === 'file' && 
            field.label === taskData.customFields[index].label && 
            field.value === previousFileUrl
        )
      );

      // Only delete the previous file if it is not the original
      if (previousFileUrl && !isOriginalFile) {
        const deleteResponse = await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: previousFileUrl })
        });

        if (!deleteResponse.ok) throw new Error('Failed to delete previous file');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('File upload failed');

      const data = await response.json();

      // Update form state with new file
      setTaskData(prev => {
        const updatedFields = [...prev.customFields];
        updatedFields[index] = {
          ...updatedFields[index],
          value: data.fileUrl,
          fileUrl: data.fileUrl,
          fileName: data.fileName
        };
        return { ...prev, customFields: updatedFields };
      });

      setHasUnsavedChanges(true);
    } catch (error) {
      setError('Error uploading file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDelete = async (index) => {
    const fileUrl = taskData.customFields[index].fileUrl;
    if (!fileUrl) return;

    try {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl })
      });

      if (!response.ok) throw new Error('Failed to delete file');

      setTaskData(prev => {
        const updatedFields = [...prev.customFields];
        updatedFields[index] = {
          ...updatedFields[index],
          value: '',
          fileUrl: null,
          fileName: null
        };
        return { ...prev, customFields: updatedFields };
      });
    } catch (error) {
      setError('Error deleting file: ' + error.message);
    }
  };

  const handlePreview = (url) => {
    const previewUrl = url.startsWith('/uploads/') ? url : `/uploads/${url}`;
    setPreviewUrl(previewUrl);
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };

  // Modify handleSubmit to handle file cleanup after successful submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await onSubmit(taskData);
      if (success) {
        router.push('/users');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup function for unsaved files on reload
  const cleanupUnsavedFiles = async () => {
    try {
      const currentFiles = taskData.customFields.filter(field => field.fileUrl);
      
      for (const field of currentFiles) {
        // Check if this is not the original file
        const isOriginalFile = Boolean(
          initialData?.customFields?.find(
            initField => initField.value === field.fileUrl
          )
        );

        if (!isOriginalFile && field.fileUrl) {
          try {
            const response = await fetch('/api/upload', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fileUrl: field.fileUrl
              })
            });

            if (!response.ok) {
              console.error('Failed to delete file:', field.fileUrl);
            }
          } catch (error) {
            console.error('Error deleting file:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  };

  // Add useEffect for handling page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        cleanupUnsavedFiles();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, taskData, initialData]);

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (confirmed) {
        cleanupUnsavedFiles();
        router.push('/users');
      }
    } else {
      router.push('/users');
    }
  };

  const phoneInputStyles = `
    .PhoneInput {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }
    .PhoneInputCountry {
      display: flex;
      align-items: center;
      background: #374151;
      padding: 0.5rem;
      border: 1px solid #4b5563;
      border-radius: 0.5rem;
      color: white;
    }
    .PhoneInputCountrySelect {
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      padding-right: 0.5rem;
      background: #374151;
    }
    .PhoneInputInput {
      flex: 1;
      padding: 0.5rem 1rem;
      border: 1px solid #4b5563;
      border-radius: 0.5rem;
      font-size: 1rem;
      line-height: 1.5;
      color: white;
      background-color: #374151;
    }
    .PhoneInputInput:focus {
      outline: none;
      ring: 2px;
      ring-color: #3b82f6;
      border-color: #3b82f6;
    }
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <style>{phoneInputStyles}</style>

      {/* Custom Fields Section */}
      <div className="space-y-4 mt-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Custom Fields</h3>
          
        </div>
        
        {taskData.customFields.map((field, index) => (
          <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <div
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
              >{field.label}</div>
              <div className="flex gap-4">
                

                {field.type === 'number' ? (
                  <div className="flex-1">
                    <PhoneInput
                      international
                      countryCallingCodeEditable={false}
                      defaultCountry="US"
                      value={field.value}
                      onChange={(value) => handlePhoneNumberChange(value, index)}
                      className="phone-input-container"
                    />
                  </div>
                ) : field.type === 'file' ? (
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={el => fileInputRefs.current[index] = el}
                      onChange={(e) => handleFileUpload(index, e.target.files[0])}
                      className="hidden"
                    />
                    <div className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Choose File
                      </button>
                      {field.fileUrl && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {field.fileName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePreview(field.fileUrl)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFileDelete(index)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : field.type === 'date' ? (
                  <input
                    type="datetime-local"
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleCustomFieldDateChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={field.value || ''}
                    onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                )}
              </div>
              
            </div>
            
          </div>
        ))}
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={handleCancel}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium
            hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Saving...' : (initialData ? 'Update Task' : 'Create Task')}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">File Preview</h2>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative w-full h-[70vh]">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0 rounded-lg"
                title="File Preview"
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
} 