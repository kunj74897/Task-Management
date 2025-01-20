import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/app/lib/db';
import User from '@/app/models/User';

export async function POST(request) {
  try {
    await connectDB();
    const { username, password, mobileNo, role, status } = await request.json();

    // Validate required fields
    if (!username || !password || !mobileNo || !role) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Validate role enum
    if (!['salesman', 'purchaseman'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      );
    }

    // Validate status enum
    if (status && !['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status selected' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with validated data
    const user = await User.create({
      username,
      password: hashedPassword,
      mobileNo,
      role,
      status: status || 'active',
      taskStats: {
        pending: 0,
        inProgress: 0,
        completed: 0
      }
    });

    // Return user without sensitive data
    const userResponse = {
      _id: user._id,
      username: user.username,
      mobileNo: user.mobileNo,
      role: user.role,
      status: user.status,
      taskStats: user.taskStats
    };

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating user' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    
    const users = await User.find({})
      .select('-password -recentActivity')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error fetching users' },
      { status: 500 }
    );
  }
} 