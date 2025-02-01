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

    // Handle task acceptance/rejection
    if (data.assignmentStatus) {
      if (data.assignmentStatus === 'accepted') {
        task.assignedTo = data.userId;
        task.assignmentStatus = 'accepted';
        task.status = 'in-progress';
      } else if (data.assignmentStatus === 'rejected') {
        task.assignmentStatus = 'pending';
        // If it was directly assigned to this user, clear the assignment
        if (task.assignedTo?.toString() === data.userId) {
          task.assignedTo = undefined;
        }
      }
    }

    // Add to history
    task.history.push({
      action: `Task ${data.assignmentStatus} by user`,
      performedBy: data.userId,
      timestamp: new Date()
    });

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate('assignedTo', 'username')
      .populate('history.performedBy', 'username');

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
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