'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditUser({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobileNo: '',
    role: '',
    status: 'active'
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`);
      const data = await response.json();
      setFormData({
        username: data.username,
        email: data.email,
        mobileNo: data.mobileNo,
        role: data.role,
        status: data.status
      });
    } catch (error) {
      setError('Error fetching user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      router.push('/admin/users');
      router.refresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
      <h1 className="text-3xl font-bold mb-6">Edit User</h1>
      {/* Form JSX similar to create user form but with updated values */}
    </div>
  );
} 