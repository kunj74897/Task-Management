import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/app/lib/db';
import User from '@/app/models/User';

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } =await  params;
    const updates = await request.json();

    // If password is empty, remove it from updates
    if (!updates.password) {
      delete updates.password;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { 
        $set: {
          ...updates,
          assignedTasks: updates.assignedTasks || []
        }
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const id = request.url.split('/').pop();
    const user = await User.findById(id).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching user' },
      { status: 500 }
    );
  }
}