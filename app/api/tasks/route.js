import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';

// Create Task
export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Validate assignedRole if present
    if (data.assignType === 'role' && !data.assignedRole) {
      return NextResponse.json(
        { error: 'Assigned role is required when assignment type is role' },
        { status: 400 }
      );
    }

    // Validate role enum
    if (data.assignedRole && !['salesman', 'purchaseman'].includes(data.assignedRole)) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      );
    }

    // Convert time strings to Date objects
    const now = new Date();
    const startTime = data.notificationStartTime ? 
      new Date(`${now.toISOString().split('T')[0]}T${data.notificationStartTime}:00`) : 
      new Date(`${now.toISOString().split('T')[0]}T09:00:00`);
    
    const endTime = data.notificationEndTime ? 
      new Date(`${now.toISOString().split('T')[0]}T${data.notificationEndTime}:00`) : 
      new Date(`${now.toISOString().split('T')[0]}T17:00:00`);

    // Format and validate notification settings
    const taskData = {
      ...data,
      notificationFrequency: {
        type: data.notificationType || 'once',
        interval: data.notificationInterval || 'daily',
        customInterval: {
          hours: Math.min(Math.max(parseInt(data.notificationHours) || 0, 0), 23),
          minutes: Math.min(Math.max(parseInt(data.notificationMinutes) || 0, 0), 59)
        },
        startTime,
        endTime
      }
    };

    // Remove temporary notification fields
    delete taskData.notificationType;
    delete taskData.notificationInterval;
    delete taskData.notificationHours;
    delete taskData.notificationMinutes;
    delete taskData.notificationStartTime;
    delete taskData.notificationEndTime;

    // Clear assignedRole if assignType is user
    if (taskData.assignType === 'user') {
      taskData.assignedRole = undefined;
    }

    // Clear assignedTo if assignType is role
    if (taskData.assignType === 'role') {
      taskData.assignedTo = undefined;
    }

    const task = await Task.create(taskData);
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'username');
    
    return NextResponse.json(populatedTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating task' },
      { status: 500 }
    );
  }
}

// Get All Tasks
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Build query
    const query = {};
    
    // Filter by status if provided
    const status = searchParams.get('status');
    if (status) query.status = status;
    
    // Filter by priority if provided
    const priority = searchParams.get('priority');
    if (priority) query.priority = priority;
    
    // Filter by assigned role
    const role = searchParams.get('role');
    if (role) query.assignedRole = role;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'username')
      .sort({ createdAt: -1 });
      
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching tasks' },
      { status: 500 }
    );
  }
} 