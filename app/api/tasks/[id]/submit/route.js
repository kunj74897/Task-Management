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
    const userid = await params
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files');
    const fileFields = formData.getAll('fileFields');
    
    // Handle file uploads
    const uploadedFiles = {};
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fieldName = fileFields[i];
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Create unique filename
      const filename = `${Date.now()}-${file.name}`;
      const path = join(process.cwd(), 'public', 'uploads', filename);
      
      await writeFile(path, buffer);
      uploadedFiles[fieldName] = `/uploads/${filename}`;
    }

    // Get other form data
    const customFields = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'files' && key !== 'fileFields') {
        customFields[key] = value;
      }
    }

    // Update task with submission
    const submission = {
      userId: user.id,
      timestamp: new Date(),
      files: uploadedFiles,
      customFields
    };

    await Task.findByIdAndUpdate(userid.id, {
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