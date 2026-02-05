import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';

function parseAuthHeader(req) {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;
  const parts = auth.split(' ');
  return parts.length === 2 ? parts[1] : null;
}

export async function POST(req) {
  try {
    console.log('Category image upload request received');

    const token = parseAuthHeader(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const decoded = await getAuth().verifyIdToken(token);
    const userId = decoded.uid;
    console.log('Token verified for user:', userId);

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file');
    const fileName = formData.get('fileName') || `category-${Date.now()}`;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (max 2MB per image for faster uploads)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum 2MB per image.' },
        { status: 413 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Uploading to ImageKit:', fileName);

    // Use ImageKit REST API directly with base64 encoding
    const base64File = buffer.toString('base64');
    const authHeader = Buffer.from(
      `${process.env.IMAGEKIT_PRIVATE_KEY}:`
    ).toString('base64');

    const uploadBody = new URLSearchParams({
      file: base64File,
      fileName: fileName,
      folder: '/quickfynd/home-categories',
      tags: 'home-category',
    });

    const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
      body: uploadBody,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      console.error('ImageKit API error:', errorData);
      throw new Error(`ImageKit upload failed: ${uploadResponse.status}`);
    }

    const uploadedData = await uploadResponse.json();
    console.log('Image uploaded to ImageKit:', uploadedData.url);

    return NextResponse.json(
      {
        url: uploadedData.url,
        fileId: uploadedData.fileId,
        message: 'Image uploaded successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
