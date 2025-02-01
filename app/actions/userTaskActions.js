'use server'

import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';

export async function getTaskStats(userId) {
  if (!userId) return { pending: 0, inProgress: 0, completed: 0 };
  
  await connectDB();
  
  const [pending, inProgress, completed] = await Promise.all([
    Task.countDocuments({ assignedTo: userId, status: 'pending' }),
    Task.countDocuments({ assignedTo: userId, status: 'in-progress' }),
    Task.countDocuments({ assignedTo: userId, status: 'completed' })
  ]);

  return { pending, inProgress, completed };
} 