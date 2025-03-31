import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

// Get Single Task
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const task = await Task.findById(id)
      .populate('assignedTo', 'username')
      .populate('history.performedBy', 'username')
      .lean();
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Convert MongoDB objects to plain objects and handle dates
    const serializedTask = {
      ...task,
      _id: task._id.toString(),
      createdAt: task.createdAt?.toISOString(),
      updatedAt: task.updatedAt?.toISOString(),
      assignedTo: task.assignedTo?.map(user => ({
        ...user,
        _id: user._id.toString()
      })),
      fields: task.fields?.map(field => ({
        ...field,
        _id: field._id?.toString()
      }))
    };

    return NextResponse.json(serializedTask);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Error fetching task' },
      { status: 500 }
    );
  }
}

// Update Task
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();
    
    console.log('Updating task:', { id, updates });

    // Validate custom fields if present
    if (updates.customFields) {
      // Check if this is a request from the user interface (not admin)
      const isUserRequest = updates.isUserRequest === true;
      
      for (const field of updates.customFields) {
        // Skip required validation for admin requests
        if (isUserRequest && field.required && !field.value) {
          return NextResponse.json(
            { error: `${field.label} is required` },
            { status: 400 }
          );
        }
        
        // Keep other validations that should apply to both admin and users
        if (field.type === 'number' && field.value && isNaN(field.value)) {
          return NextResponse.json(
            { error: `${field.label} must be a valid number` },
            { status: 400 }
          );
        }
      }
    }

    // Map custom fields to the correct format
    if (updates.customFields) {
      updates.fields = updates.customFields.map(field => ({
        label: field.label,
        type: field.type,
        value: field.value,
        required: field.required
      }));
      delete updates.customFields;
    }

    // Clear previous assignments based on assignment type
    if (updates.assignType === 'role') {
      updates.assignedTo = [];  // Clear user assignments
      updates.assignedRole = updates.assignedRole;  // Set new role
    } else if (updates.assignType === 'user') {
      updates.assignedRole = '';  // Clear role assignment
      updates.assignedTo = updates.assignedTo ? [updates.assignedTo] : [];  // Set new user
    }

    // Remove assignType as it's not part of the model
    delete updates.assignType;

    const task = await Task.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).populate('assignedTo', 'username');

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// Delete Task
export async function DELETE(request) {
  try {
    await connectDB();
    const id = request.url.split('/').pop();
    const task = await Task.findByIdAndDelete(id);
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting task' },
      { status: 500 }
    );
  }
} 