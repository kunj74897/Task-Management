'use server'

import { revalidatePath } from 'next/cache';
import connectDB from '@/app/lib/db';
import User from '@/app/models/User';

export async function getUsers() {
  await connectDB();
  const users = await User.find({}).select('-password');
  return JSON.parse(JSON.stringify(users));
}

export async function deleteUser(userId) {
  try {
    await connectDB();
    await User.findByIdAndDelete(userId);
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateUser(userId, userData) {
  try {
    await connectDB();
    const user = await User.findByIdAndUpdate(userId, userData, { new: true }).select('-password');
    revalidatePath('/admin/users');
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
} 