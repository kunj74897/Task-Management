'use server'

import { revalidatePath } from 'next/cache';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';
import User from '@/app/models/User';
import mongoose from 'mongoose';

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

export async function acceptTask(taskId, userId) {
  try {
    await connectDB();
    
    // First check if task exists and is available
    const existingTask = await Task.findById(taskId).lean();
    if (!existingTask) {
      throw new Error('Task not found');
    }
    
    if (existingTask.assignmentStatus !== 'pending') {
      throw new Error('Task is no longer available');
    }

    // Update task
    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        $set: {
          assignedTo: [userId],
          assignmentStatus: 'accepted',
          status: 'in-progress'
        }
      },
      { new: true, lean: true }
    );

    // Update user's assignedTasks
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { assignedTasks: taskId } }
    );

    // Manually serialize the task to avoid circular references
    const serializedTask = {
      _id: task._id.toString(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignmentStatus: task.assignmentStatus,
      assignedTo: task.assignedTo.map(id => id.toString()),
      createdAt: task.createdAt?.toISOString(),
      updatedAt: task.updatedAt?.toISOString()
    };

    return { success: true, task: serializedTask };
  } catch (error) {
    console.error('Accept task error:', error);
    return { success: false, error: error.message };
  }
} 