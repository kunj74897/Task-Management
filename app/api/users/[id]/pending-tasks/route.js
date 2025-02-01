import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';
import User from '@/app/models/User';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const paramstore = await params;
    const userId = paramstore.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's role
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Fetching tasks for user:', {
      userId: user._id,
      role: user.role
    });

    // Find tasks that match either condition
    const tasks = await Task.find({
      $or: [
        // Tasks directly assigned to the user
        {
          assignedTo: userId,
          assignmentStatus: 'pending'
        },
        // Tasks assigned to the user's role
        {
          assignedRole: user.role,
          assignmentStatus: 'pending',
          $or: [
            { assignedTo: { $exists: false } },
            { assignedTo: null }
          ]
        }
      ]
    }).sort({ createdAt: -1 });

    console.log('Found tasks:', tasks);

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    return NextResponse.json(
      { error: 'Error fetching pending tasks' },
      { status: 500 }
    );
  }
} 