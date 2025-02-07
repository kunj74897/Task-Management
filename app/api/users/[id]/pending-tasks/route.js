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

    // Find tasks that are either:
    // 1. Assigned to user's role and not yet accepted by anyone
    // 2. Directly assigned to user and pending acceptance
    const tasks = await Task.find({
      $or: [
        {
          assignedRole: user.role,
          status: 'pending',
          assignmentStatus: 'pending',
          $or: [
            { assignedTo: { $exists: false } },
            { assignedTo: null },
            { assignedTo: [] }
          ]
        },
        {
          assignedTo: userId,
          status: 'pending',
          assignmentStatus: 'pending'
        }
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