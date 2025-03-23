import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import User from '@/app/models/User';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const paramstore = await params;
    const userId = paramstore.id;

    // Get user with populated assignedTasks
    const user = await User.findById(userId)
      .populate({
        path: 'assignedTasks',
        select: '_id title description priority status assignmentStatus assignedRole'
      })
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Convert MongoDB objects to plain objects
    const serializedTasks = (user.assignedTasks || []).map(task => ({
      ...task,
      _id: task._id.toString()
    }));

    return NextResponse.json(serializedTasks);
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    return NextResponse.json(
      { error: 'Error fetching assigned tasks' },
      { status: 500 }
    );
  }
} 