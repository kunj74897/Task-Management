import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import User from '@/app/models/User';
import { getCurrentUser } from '@/app/actions/authActions';

export async function GET() {
  try {
    await connectDB();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user with populated assignedTasks
    const userWithTasks = await User.findById(user.id)
      .populate('assignedTasks')
      .exec();

    return NextResponse.json(userWithTasks.assignedTasks || []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching assigned tasks' },
      { status: 500 }
    );
  }
} 