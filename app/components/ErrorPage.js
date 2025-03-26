'use client';

import Link from 'next/link';

export default function ErrorPage({ title = 'An error occurred', message, backUrl = '/' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6">
          <svg 
            className="mx-auto h-16 w-16 text-red-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {message || 'We encountered an unexpected error. Please try again or contact support if the problem persists.'}
        </p>
        
        <Link 
          href={backUrl}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Go Back
        </Link>
      </div>
    </div>
  );
} 