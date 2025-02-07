import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import connectDB from '@/app/lib/db';
import Task from '@/app/models/Task';
import { getCurrentUser } from '@/app/actions/authActions';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await getCurrentUser();
    const userID = await params
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files');
    
    // Handle file uploads
    const uploadedFiles = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Create unique filename
      const filename = `${Date.now()}-${file.name}`;
      const path = join(process.cwd(), 'public', 'uploads', filename);
      
      await writeFile(path, buffer);
      uploadedFiles.push(`/uploads/${filename}`);
    }

    // Update task with submission
    const submission = {
      userId: user.id,
      timestamp: new Date(),
      files: uploadedFiles,
      customFields: Object.fromEntries(formData.entries())
    };

    await Task.findByIdAndUpdate(userID.id, {
      $push: { submissions: submission }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json(
      { error: 'Error submitting task' },
      { status: 500 }
    );
  }
} 