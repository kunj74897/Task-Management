'use client';

import { useState, useEffect, useRef } from 'react';

export default function TaskFilters({ onFiltersChange }) {
  // Input states that change immediately on user input
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Use refs to track previous values to prevent unnecessary updates
  const prevFiltersRef = useRef({ searchTerm: '', statusFilter: 'all', priorityFilter: 'all', roleFilter: 'all' });

  // Handle debounced search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only trigger if the value actually changed
      if (searchTerm !== prevFiltersRef.current.searchTerm) {
        prevFiltersRef.current.searchTerm = searchTerm;
        onFiltersChange({
          searchTerm,
          statusFilter: prevFiltersRef.current.statusFilter,
          priorityFilter: prevFiltersRef.current.priorityFilter,
          roleFilter: prevFiltersRef.current.roleFilter
        });
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, onFiltersChange]);

  // Handle status filter change
  useEffect(() => {
    if (statusFilter !== prevFiltersRef.current.statusFilter) {
      prevFiltersRef.current.statusFilter = statusFilter;
      onFiltersChange({
        searchTerm: prevFiltersRef.current.searchTerm,
        statusFilter,
        priorityFilter: prevFiltersRef.current.priorityFilter,
        roleFilter: prevFiltersRef.current.roleFilter
      });
    }
  }, [statusFilter, onFiltersChange]);

  // Handle priority filter change
  useEffect(() => {
    if (priorityFilter !== prevFiltersRef.current.priorityFilter) {
      prevFiltersRef.current.priorityFilter = priorityFilter;
      onFiltersChange({
        searchTerm: prevFiltersRef.current.searchTerm,
        statusFilter: prevFiltersRef.current.statusFilter,
        priorityFilter,
        roleFilter: prevFiltersRef.current.roleFilter
      });
    }
  }, [priorityFilter, onFiltersChange]);

  // Handle role filter change
  useEffect(() => {
    if (roleFilter !== prevFiltersRef.current.roleFilter) {
      prevFiltersRef.current.roleFilter = roleFilter;
      onFiltersChange({
        searchTerm: prevFiltersRef.current.searchTerm,
        statusFilter: prevFiltersRef.current.statusFilter,
        priorityFilter: prevFiltersRef.current.priorityFilter,
        roleFilter
      });
    }
  }, [roleFilter, onFiltersChange]);

  return (
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
  );
} 