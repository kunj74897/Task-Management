'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import AlertMessage from '@/app/components/AlertMessage';

export default function TaskForm({ initialData, onSubmit }) {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [taskData, setTaskData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium',
    assignType: initialData?.assignType || 'role',
    assignedTo: initialData?.assignedTo || '',
    assignedRole: initialData?.assignedRole || '',
    status: initialData?.status || 'pending',
    notificationType: initialData?.notificationType || 'once',
    notificationInterval: initialData?.notificationInterval || 'daily',
    notificationHours: initialData?.notificationHours || 0,
    notificationMinutes: initialData?.notificationMinutes || 0,
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaskData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'assignType' && {
        assignedTo: '',
        assignedRole: ''
      })
    }));
  };

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

  const addCustomField = () => {
    setTaskData(prev => ({
      ...prev,
      customFields: [...prev.customFields, { label: '', type: 'string', value: '', required: false }]
    }));
  };

  const removeCustomField = (index) => {
    setTaskData(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }));
  };

  const handleFileSelection = (index, file) => {
    if (!file) return;

    // Create a temporary local URL for preview
    const localUrl = URL.createObjectURL(file);
    
    // Store the original file URL before replacing it (for later deletion)
    // This is the URL stored in the database
    const originalFileUrl = taskData.customFields[index].value;
    
    // Store the file and its metadata in the form state
    setTaskData(prev => {
      const updatedFields = [...prev.customFields];
      updatedFields[index] = {
        ...updatedFields[index],
        tempFile: file,
        fileUrl: localUrl,
        fileName: file.name,
        originalFileUrl: originalFileUrl, // Store the original URL for deletion on submit
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

  const handleFileDelete = async (index) => {
    // Revoke the object URL to prevent memory leaks
    if (taskData.customFields[index].fileUrl && !taskData.customFields[index].fileUrl.startsWith('/uploads/')) {
      URL.revokeObjectURL(taskData.customFields[index].fileUrl);
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
  };

  const handlePreview = (url) => {
    // If it's a local URL (blob:), we can preview it directly
    if (url.startsWith('blob:')) {
      // Get file extension from the filename in state
      const field = taskData.customFields.find(f => f.fileUrl === url);
      const fileName = field?.fileName || '';
      const fileExt = fileName.split('.').pop().toLowerCase();
      
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
      const pdfExt = 'pdf';
      
      setPreviewUrl({
        url: url,
        type: imageExts.includes(fileExt) ? 'image' : 
              fileExt === pdfExt ? 'pdf' : 'other'
      });
    } else {
      // For server URLs, use the existing logic
      const previewUrl = url.startsWith('/uploads/') ? url : `/uploads/${url.split('/').pop()}`;
      
      const fileExt = url.split('.').pop().toLowerCase();
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
      const pdfExt = 'pdf';
      
      setPreviewUrl({
        url: previewUrl,
        type: imageExts.includes(fileExt) ? 'image' : 
              fileExt === pdfExt ? 'pdf' : 'other'
      });
    }
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, upload any temporary files
      const updatedTaskData = { ...taskData };
      
      // Process each file field
      for (let index = 0; index < updatedTaskData.customFields.length; index++) {
        const field = updatedTaskData.customFields[index];
        
        // If this is a file field with a temporary file
        if (field.type === 'file' && tempFiles[index]) {
          // If there was a previously submitted file, delete it
          if (field.originalFileUrl) {
            try {
              console.log('Deleting previous file:', field.originalFileUrl);
              const deleteResponse = await fetch('/api/upload', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileUrl: field.originalFileUrl })
              });
              
              if (!deleteResponse.ok) {
                console.warn('Failed to delete previous file:', field.originalFileUrl);
              }
            } catch (error) {
              console.error('Error deleting previous file:', error);
            }
          }
          
          // Upload the new file
          const fileFormData = new FormData();
          fileFormData.append('file', tempFiles[index]);
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: fileFormData
          });
          
          if (!response.ok) throw new Error('File upload failed');
          
          const data = await response.json();
          
          // Update the field with the permanent URL
          updatedTaskData.customFields[index] = {
            ...field,
            value: data.fileUrl,  // Store the URL in the value field for database storage
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            originalFileUrl: null // Clear the original URL reference
          };
          
          // Revoke the temporary URL to prevent memory leaks
          if (field.fileUrl && field.fileUrl.startsWith('blob:')) {
            URL.revokeObjectURL(field.fileUrl);
          }
        }
      }
      
      // Create a JSON object for submission instead of FormData
      const submissionData = {
        title: updatedTaskData.title,
        description: updatedTaskData.description,
        priority: updatedTaskData.priority,
        assignType: updatedTaskData.assignType,
        assignedTo: updatedTaskData.assignedTo,
        assignedRole: updatedTaskData.assignedRole,
        status: updatedTaskData.status,
        notificationType: updatedTaskData.notificationType,
        notificationInterval: updatedTaskData.notificationInterval,
        notificationHours: updatedTaskData.notificationHours,
        notificationMinutes: updatedTaskData.notificationMinutes,
        customFields: updatedTaskData.customFields.map(field => ({
          label: field.label,
          type: field.type,
          value: field.value || '',
          required: field.required
        })),
        isAdminRequest: true // Add this flag to indicate it's coming from admin
      };

      const success = await onSubmit(submissionData);
      if (success) {
        // Clear temporary files state
        setTempFiles({});
        setHasUnsavedChanges(false);
        router.push('/admin/tasks');
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
        router.push('/admin/tasks');
      }
    } else {
      router.push('/admin/tasks');
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
      
      {error && (
        <AlertMessage 
          message={error} 
          type="error" 
          onClose={() => setError("")} 
        />
      )}
      
      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={taskData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                text-gray-900 dark:text-white
                bg-white dark:bg-gray-700
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              name="priority"
              value={taskData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                text-gray-900 dark:text-white
                bg-white dark:bg-gray-700
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={taskData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                text-gray-900 dark:text-white
                bg-white dark:bg-gray-700
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Assignment Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Assignment</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Assignment Type
            </label>
            <select
              name="assignType"
              value={taskData.assignType}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="role">Assign to Role</option>
              <option value="user">Assign to User</option>
            </select>
          </div>

          {taskData.assignType === 'role' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assign to Role
              </label>
              <select
                name="assignedRole"
                value={taskData.assignedRole}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Role</option>
                <option value="salesman">Salesman</option>
                <option value="purchaseman">Purchaseman</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assign to User
              </label>
              <select
                name="assignedTo"
                value={taskData.assignedTo}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select User</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Notification Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Type
            </label>
            <select
              name="notificationType"
              value={taskData.notificationType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                text-gray-900 dark:text-white
                bg-white dark:bg-gray-700
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="once">Once</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>

          {taskData.notificationType === 'recurring' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interval
                </label>
                <select
                  name="notificationInterval"
                  value={taskData.notificationInterval}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                    text-gray-900 dark:text-white
                    bg-white dark:bg-gray-700
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {taskData.notificationInterval === 'custom' && (
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hours
                    </label>
                    <input
                      type="number"
                      name="notificationHours"
                      value={taskData.notificationHours}
                      onChange={handleChange}
                      min="0"
                      max="23"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                        text-gray-900 dark:text-white
                        bg-white dark:bg-gray-700
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minutes
                    </label>
                    <input
                      type="number"
                      name="notificationMinutes"
                      value={taskData.notificationMinutes}
                      onChange={handleChange}
                      min="0"
                      max="59"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                        text-gray-900 dark:text-white
                        bg-white dark:bg-gray-700
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Custom Fields Section */}
      <div className="space-y-4 mt-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Custom Fields</h3>
          <button
            type="button"
            onClick={addCustomField}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Field
          </button>
        </div>
        
        {taskData.customFields.map((field, index) => (
          <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Field Label"
                value={field.label}
                onChange={(e) => handleCustomFieldChange(index, 'label', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
              />
              <div className="flex gap-4">
                <select
                  value={field.type}
                  onChange={(e) => handleCustomFieldChange(index, 'type', e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="string">Text</option>
                  <option value="number">Phone Number</option>
                  <option value="date">Date</option>
                  <option value="file">File</option>
                </select>

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
                      onChange={(e) => handleFileSelection(index, e.target.files[0])}
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
              <div className="mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => handleCustomFieldChange(index, 'required', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Required field <span className="text-xs italic">(only enforced for users, not in admin)</span>
                  </span>
                </label>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeCustomField(index)}
              className="p-2 text-red-600 hover:text-red-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
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