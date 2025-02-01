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
    
    // Start a session for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update the task
      const task = await Task.findByIdAndUpdate(
        taskId,
        {
          assignedTo: userId,
          assignmentStatus: 'accepted',
          status: 'in-progress'
        },
        { new: true, session }
      );

      // Update the user's assignedTasks array
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { assignedTasks: taskId } },
        { session }
      );

      // Commit the transaction
      await session.commitTransaction();
      revalidatePath('/users');
      return { success: true, task };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
} 