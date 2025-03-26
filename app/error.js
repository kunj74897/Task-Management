'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-extrabold text-red-600 dark:text-red-400">Error</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Something went wrong</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error.message || "We're sorry, but there was an error processing your request."}
          </p>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
} 