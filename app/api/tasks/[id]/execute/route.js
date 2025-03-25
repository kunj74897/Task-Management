import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';
import { getCurrentUser } from '@/app/actions/authActions';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await getCurrentUser();
    
    // Fix: Properly extract the taskId from params
    const taskId1 = await params;
    const taskId = taskId1.id;
    
    console.log("Task ID for submission:", taskId); // Debug log
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Get the task data from the form
    const formData = await request.formData();
    
    // Extract custom fields
    const customFields = {};
    
    // Process form data
    for (const [key, value] of formData.entries()) {
      // Handle custom fields
      if (key.startsWith('customFields')) {
        const matches = key.match(/customFields\[(\d+)\]\[(\w+)\]/);
        if (matches) {
          const [_, index, fieldName] = matches;
          
          if (!customFields[index]) {
            customFields[index] = {};
          }
          
          customFields[index][fieldName] = value;
        }
      }
    }
    
    // Convert to array format
    const fieldsArray = Object.values(customFields);
    
    // Create submission object
    const submission = {
      userId: user.id,
      timestamp: new Date(),
      customFields: fieldsArray
    };

    console.log("Updating task with ID:", taskId); // Debug log
    console.log("Submission data:", submission); // Debug log

    // Update the task with the submission
    const updatedTask = await Task.findByIdAndUpdate(taskId, {
      $push: { submissions: submission }
    }, { new: true });

    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json(
      { error: 'Error submitting task: ' + error.message },
      { status: 500 }
    );
  }
} 