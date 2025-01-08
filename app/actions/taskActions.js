'use server'

import { revalidatePath } from 'next/cache';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';

export async function getTaskStats() {
  await connectDB();
  
  const [total, pending, completed] = await Promise.all([
    Task.countDocuments(),
    Task.countDocuments({ status: 'pending' }),
    Task.countDocuments({ status: 'completed' })
  ]);

  return { total, pending, completed };
}

export async function updateTask(taskId, taskData) {
  try {
    await connectDB();
    const task = await Task.findByIdAndUpdate(taskId, taskData, { new: true })
      .populate('assignedTo', 'username');
    
    revalidatePath('/admin/tasks');
    return { success: true, task };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteTask(taskId) {
  try {
    await connectDB();
    await Task.findByIdAndDelete(taskId);
    revalidatePath('/admin/tasks');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
} 