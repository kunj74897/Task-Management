'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function TaskForm({ initialData, onSubmit }) {
  const router = useRouter();
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
  const [filesToDelete, setFilesToDelete] = useState([]);

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
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  };

  // Handle file selection (creates temporary URL)
  const handleFileSelection = (index, file) => {
    if (!file) return;

    // Create a temporary local URL for preview
    const localUrl = URL.createObjectURL(file);
    
    // Store the original file URL if there is one (for later cleanup)
    const originalFileUrl = taskData.customFields[index].fileUrl;
    
    setTaskData(prev => {
      const updatedFields = [...prev.customFields];
      updatedFields[index] = {
        ...updatedFields[index],
        tempFile: file,
        fileUrl: localUrl,
        fileName: file.name,
        originalFileUrl: originalFileUrl,
        value: null
      };
      return { ...prev, customFields: updatedFields };
    });
    
    // Track that we have unsaved changes
    setHasUnsavedChanges(true);
    
    // Store the file in our temporary files state
    setTempFiles(prev => ({
      ...prev,
      [index]: file
    }));
  };

  const handleFileDelete = (index) => {
    const field = taskData.customFields[index];
    
    // If URL is from createObjectURL, revoke it to prevent memory leaks
    if (field.fileUrl && !field.fileUrl.startsWith('/uploads/')) {
      URL.revokeObjectURL(field.fileUrl);
    }
    
    // If this is an existing file from the server, add to delete list
    if (field.fileUrl && field.fileUrl.startsWith('/uploads/')) {
      setFilesToDelete(prev => [...prev, field.fileUrl]);
    }

    setTaskData(prev => {
      const updatedFields = [...prev.customFields];
      updatedFields[index] = {
        ...updatedFields[index],
        tempFile: null,
        fileUrl: null,
        fileName: null,
        value: ''
      };
      return { ...prev, customFields: updatedFields };
    });
    
    // Remove from temp files
    setTempFiles(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
    
    setHasUnsavedChanges(true);
  };

  const handlePreview = (url) => {
    if (!url) return;
    
    // Determine file type for preview handling
    let previewType = 'other';
    const fileExt = typeof url === 'string' 
      ? url.split('.').pop().toLowerCase()
      : '';
      
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    const pdfExt = 'pdf';
    
    if (imageExts.includes(fileExt)) {
      previewType = 'image';
    } else if (fileExt === pdfExt) {
      previewType = 'pdf';
    }
    
    // Set the preview URL with its type for proper rendering
    setPreviewUrl({
      url: url,
      type: previewType
    });
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };

  const handleCancel = () => {
    // Clean up any temporary object URLs to prevent memory leaks
    taskData.customFields.forEach(field => {
      if (field.fileUrl && !field.fileUrl.startsWith('/uploads/')) {
        URL.revokeObjectURL(field.fileUrl);
      }
    });
    
    // Navigate back
    router.back();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Upload any temporary files first
      const updatedTaskData = { ...taskData };
      
      // Process each field that has a temporary file
      for (const [index, field] of updatedTaskData.customFields.entries()) {
        if (field.tempFile) {
          const formData = new FormData();
          formData.append('file', field.tempFile);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload file: ${field.fileName}`);
          }
          
          const data = await uploadResponse.json();
          
          // Update the field with the permanent URL
          updatedTaskData.customFields[index] = {
            ...field,
            value: data.fileUrl,  // Store the URL in the value field for database storage
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            tempFile: null, // Clear the temp file
            originalFileUrl: null // Clear the original URL reference
          };
          
          // Revoke the temporary URL to prevent memory leaks
          if (field.fileUrl && field.fileUrl.startsWith('blob:')) {
            URL.revokeObjectURL(field.fileUrl);
          }
        } else if (field.type === 'file' && field.fileUrl && field.fileUrl.startsWith('/uploads/')) {
          // For existing files that weren't changed, ensure value matches fileUrl
          updatedTaskData.customFields[index] = {
            ...field,
            value: field.fileUrl
          };
        }
      }
      
      // Delete any files marked for deletion
      for (const fileUrl of filesToDelete) {
        if (fileUrl && fileUrl.startsWith('/uploads/')) {
          try {
            await fetch('/api/upload', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileUrl: fileUrl
              }),
            });
          } catch (error) {
            console.error('Failed to delete file:', error);
          }
        }
      }
      
      // Create a JSON object for submission
      const submissionData = {
        status: 'completed',
        fields: updatedTaskData.customFields.map(field => ({
          label: field.label,
          type: field.type,
          value: field.value || '',
          required: field.required
        }))
      };

      const success = await onSubmit(submissionData);
      
      if (success) {
        // Clean up any remaining temporary URLs
        updatedTaskData.customFields.forEach(field => {
          if (field.fileUrl && field.fileUrl.startsWith('blob:')) {
            URL.revokeObjectURL(field.fileUrl);
          }
        });
        
        setTempFiles({});
        setFilesToDelete([]);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      setError(error.message || 'An error occurred while submitting the task');
    } finally {
      setLoading(false);
    }
  };

  // Handle before unload to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Clean up any temporary object URLs when component unmounts
      taskData.customFields.forEach(field => {
        if (field.fileUrl && !field.fileUrl.startsWith('/uploads/')) {
          URL.revokeObjectURL(field.fileUrl);
        }
      });
    };
  }, [hasUnsavedChanges, taskData.customFields]);

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

      {/* Task Information Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Task Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={taskData.title}
              disabled
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={taskData.description}
              disabled
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Custom Fields Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Required Information</h2>
        <div className="space-y-4">
          {taskData.customFields.map((field, index) => (
            <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-1">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    {field.type === 'file' ? (
                      <div>
                        <input
                          type="file"
                          ref={el => fileInputRefs.current[index] = el}
                          onChange={(e) => handleFileSelection(index, e.target.files[0])}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[index]?.click()}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Choose File
                        </button>
                        {field.fileUrl && (
                          <div className="flex items-center gap-2 mt-2">
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
                    ) : field.type === 'number' ? (
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
            </div>
          ))}
        </div>
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
          {loading ? 'Saving...' : 'Complete Task'}
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
              {previewUrl.type === 'image' ? (
                <img 
                  src={previewUrl.url} 
                  alt="File Preview" 
                  className="w-full h-full object-contain"
                />
              ) : previewUrl.type === 'pdf' ? (
                <iframe
                  src={previewUrl.url}
                  className="w-full h-full border-0 rounded-lg"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    Preview not available for this file type
                  </p>
                  <a 
                    href={previewUrl.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
} 