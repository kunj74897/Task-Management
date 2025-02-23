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

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    let query = {};

    // Add search conditions if search parameter exists
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { mobileNo: { $regex: search, $options: 'i' } }
      ];
    }

    // Add role filter if role parameter exists and is not 'all'
    if (role && role !== 'all') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching users' },
      { status: 500 }
    );
  }
} 