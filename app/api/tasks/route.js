import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';

export async function POST(request) {
  try {
    await connectDB();

    const data = await request.json();
    const { assignType, assignedTo, assignedRole, ...taskData } = data;

    const task = await Task.create({
      ...taskData,
      assignedTo: assignType === 'user' ? assignedTo : null,
      assignedRole: assignType === 'role' ? assignedRole : null,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Error creating task' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const tasks = await Task.find({}).populate('assignedTo', 'username');
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching tasks' },
      { status: 500 }
    );
  }
} 