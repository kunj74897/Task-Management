import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';

// Create Task
export async function POST(request) {
  try {
    await connectDB();
    const taskData = await request.json();

    // Validate required fields
    if (!taskData.title || !taskData.description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Validate custom fields
    if (taskData.customFields) {
      for (const field of taskData.customFields) {
        if (field.required && !field.value) {
          return NextResponse.json(
            { error: `${field.label} is required` },
            { status: 400 }
          );
        }
        if (field.type === 'number' && field.value && isNaN(field.value)) {
          return NextResponse.json(
            { error: `${field.label} must be a valid number` },
            { status: 400 }
          );
        }
        if (field.type === 'date' && field.value) {
          const date = new Date(field.value);
          if (isNaN(date.getTime())) {
            return NextResponse.json(
              { error: `${field.label} must be a valid date` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Validate assignedRole if present
    if (taskData.assignType === 'role' && !taskData.assignedRole) {
      return NextResponse.json(
        { error: 'Assigned role is required when assignment type is role' },
        { status: 400 }
      );
    }

    // Validate role enum
    if (taskData.assignedRole && !['salesman', 'purchaseman'].includes(taskData.assignedRole)) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      );
    }

    // Convert time strings to Date objects
    const now = new Date();
    const startTime = taskData.notificationStartTime ? 
      new Date(`${now.toISOString().split('T')[0]}T${taskData.notificationStartTime}:00`) : 
      new Date(`${now.toISOString().split('T')[0]}T09:00:00`);
    
    const endTime = taskData.notificationEndTime ? 
      new Date(`${now.toISOString().split('T')[0]}T${taskData.notificationEndTime}:00`) : 
      new Date(`${now.toISOString().split('T')[0]}T17:00:00`);

    // Format and validate notification settings
    const notificationData = {
      notificationFrequency: {
        type: taskData.notificationType || 'once',
        interval: taskData.notificationInterval || 'daily',
        customInterval: {
          hours: Math.min(Math.max(parseInt(taskData.notificationHours) || 0, 0), 23),
          minutes: Math.min(Math.max(parseInt(taskData.notificationMinutes) || 0, 0), 59)
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

    // Create task with custom fields
    const task = await Task.create({
      ...taskData,
      fields: taskData.customFields?.map(field => ({
        label: field.label,
        type: field.type,
        value: field.value,
        required: field.required
      })) || [],
      ...notificationData
    });

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
    
    // Add search functionality
    const search = searchParams.get('search');
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by status if provided
    const status = searchParams.get('status');
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by priority if provided
    const priority = searchParams.get('priority');
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    // Filter by assigned role
    const role = searchParams.get('role');
    if (role && role !== 'all') {
      query.assignedRole = role;
    }

    const tasks = await Task.find(query)
      .select('title description priority status assignmentStatus  assignedTo assignedRole createdAt fields')
      .populate('assignedTo', 'username')
      .sort({ createdAt: -1 });
      
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Error fetching tasks' },
      { status: 500 }
    );
  }
} 