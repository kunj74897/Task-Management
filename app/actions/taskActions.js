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
  const debug = (msg, data = {}) => {
    console.log(`[acceptTask] ${msg}`, { timestamp: new Date().toISOString(), ...data });
  };

  try {
    debug('Starting task acceptance', { taskId, userId });
    await connectDB();
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingTask = await Task.findById(taskId).lean();
      if (!existingTask) {
        throw new Error('Task not found');
      }
      
      if (existingTask.assignmentStatus !== 'pending') {
        throw new Error('Task is no longer available');
      }

      const task = await Task.findByIdAndUpdate(
        taskId,
        {
          $set: {
            assignedTo: [userId],
            assignmentStatus: 'accepted',
            status: 'in-progress'
          }
        },
        { new: true, session, lean: true }
      );

      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { assignedTasks: taskId } },
        { session }
      );

      await session.commitTransaction();
      
      // Serialize the task and its fields before returning
      const serializedTask = {
        ...task,
        _id: task._id.toString(),
        assignedTo: task.assignedTo.map(id => id.toString()),
        createdAt: task.createdAt?.toISOString(),
        updatedAt: task.updatedAt?.toISOString(),
        fields: task.fields?.map(field => ({
          ...field,
          _id: field._id?.toString()
        })) || []
      };

      return { success: true, task: serializedTask };
    } catch (error) {
      await session.abortTransaction();
      return { success: false, error: error.message };
    } finally {
      await session.endSession();
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
} 