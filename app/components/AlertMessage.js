'use client';

import { useEffect } from 'react';

export default function AlertMessage({ message, type, onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const bgColor = type === 'error' 
    ? 'bg-red-100 border-red-400 text-red-700' 
    : 'bg-green-100 border-green-400 text-green-700';

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${bgColor} px-4 py-3 rounded shadow-lg flex items-center justify-between w-auto max-w-md`}>
      <span className="block sm:inline">{message}</span>
      <button 
        onClick={onClose} 
        className="ml-4 text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
} 