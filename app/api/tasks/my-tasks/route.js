import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

export async function GET() {
  try {
    await connectDB();
    
    const cookieStore = await cookies();
    const token =  cookieStore.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verify(token.value, process.env.JWT_SECRET);
    
    const tasks = await Task.find({
      assignedTo: decoded.userId,
    })
    .populate('assignedTo', 'username')
    .sort({ createdAt: -1 });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Error fetching tasks' },
      { status: 500 }
    );
  }
} 