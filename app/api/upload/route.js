import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const previousUrl = formData.get('previousUrl');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Delete previous file if exists
    if (previousUrl) {
      const previousPath = path.join(process.cwd(), 'public', previousUrl.replace(/^\/uploads\//, ''));
      if (existsSync(previousPath)) {
        await unlink(previousPath);
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create consistent filename
    const uniquePrefix = Date.now();
    const sanitizedFileName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
    const fileName = `${uniquePrefix}-${sanitizedFileName}`;
    const relativePath = path.join('uploads', fileName);
    const absolutePath = path.join(process.cwd(), 'public', relativePath);

    // Save file
    await writeFile(absolutePath, buffer);

    // Return consistent paths
    return NextResponse.json({
      fileName: fileName,
      fileUrl: `/${relativePath.replace(/\\/g, '/')}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { fileUrl } = await request.json();
    if (!fileUrl) {
      return NextResponse.json({ error: 'No file URL provided' }, { status: 400 });
    }

    // Remove leading slash to prevent absolute path issues
    const relativePath = fileUrl.replace(/^\//, '');
    const filePath = path.join(process.cwd(), 'public', relativePath);
    
    if (existsSync(filePath)) {
      await unlink(filePath);
    } else {
      console.warn('File not found:', filePath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Error deleting file' }, { status: 500 });
  }
}