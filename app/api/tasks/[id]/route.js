import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';

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
export async function PATCH(request) {
  try {
    await connectDB();
    const id = request.url.split('/').pop();
    const data = await request.json();
    
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Add to history if status changed
    if (data.status && data.status !== task.status) {
      task.history.push({
        action: `Status changed from ${task.status} to ${data.status}`,
        performedBy: data.userId
      });
    }

    // Update task
    Object.assign(task, data);
    await task.save();

    const updatedTask = await Task.findById(id)
      .populate('assignedTo', 'username')
      .populate('history.performedBy', 'username');

    return NextResponse.json(updatedTask);
  } catch (error) {
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