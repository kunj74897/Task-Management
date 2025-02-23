import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';

export async function GET() {
  try {
    await connectDB();

    const stats = await Task.aggregate([
      {
        $unwind: '$assignedTo'
      },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          inProgress: {
            $sum: {
              $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0]
            }
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user task stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user task stats' },
      { status: 500 }
    );
  }
} 