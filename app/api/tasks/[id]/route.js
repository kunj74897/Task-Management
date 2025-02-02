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

    const task = await Task.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json(
      { error: 'Error updating task' },
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