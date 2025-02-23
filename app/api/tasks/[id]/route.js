import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

// Get Single Task
export async function GET(request) {
  try {
    await connectDB();
    const id = request.url.split('/').pop();
    
    const task = await Task.findById(id)
      .populate('assignedTo', 'username')
      .populate('history.performedBy', 'username');
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(task);
  } catch (error) {
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
      for (const field of updates.customFields) {
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

    // Handle assignment type changes
    if (updates.assignType === 'role') {
      updates.assignedTo = undefined;
    } else if (updates.assignType === 'user') {
      updates.assignedRole = undefined;
    }

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