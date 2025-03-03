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
    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find tasks where:
    // 1. Assignment status is pending AND
    // 2. Either:
    //    a. Task is assigned directly to the user OR
    //    b. Task is assigned to user's role and has no specific user assignments
    const tasks = await Task.find({
      assignmentStatus: 'pending',
      $or: [
        { assignedTo: userId }, // Tasks directly assigned to user
        {
          assignedRole: user.role,
          $or: [
            { assignedTo: { $exists: false } },
            { assignedTo: [] },
            { assignedTo: null }
          ]
        } // Tasks assigned to user's role with no specific assignments
      ]
    })
    .select('_id title description priority status assignmentStatus assignedRole createdAt fields')
    .lean()
    .exec();

    // Serialize the tasks and their fields
    const serializedTasks = tasks.map(task => ({
      ...task,
      _id: task._id.toString(),
      createdAt: task.createdAt?.toISOString(),
      assignedTo: Array.isArray(task.assignedTo) 
        ? task.assignedTo.map(id => id.toString())
        : task.assignedTo?.toString(),
      fields: task.fields?.map(field => ({
        ...field,
        _id: field._id?.toString()
      })) || []
    }));

    return NextResponse.json(serializedTasks);

  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    return NextResponse.json(
      { error: 'Error fetching pending tasks' },
      { status: 500 }
    );
  }
} 