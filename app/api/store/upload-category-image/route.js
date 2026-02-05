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

    const body = await req.json();
    const { base64Image, fileName } = body;

    if (!base64Image) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // Validate base64 format
    if (!base64Image.startsWith('data:')) {
      return NextResponse.json(
        { error: 'Invalid image format. Must be base64 data URL.' },
        { status: 400 }
      );
    }

    console.log('Uploading to ImageKit:', fileName);

    // Extract base64 data and media type
    const matches = base64Image.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid base64 format' },
        { status: 400 }
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Use ImageKit REST API directly
    const authHeader = Buffer.from(
      `${process.env.IMAGEKIT_PRIVATE_KEY}:`
    ).toString('base64');

    const uploadBody = new URLSearchParams({
      file: base64Data,
      fileName: fileName || `category-${Date.now()}`,
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
      const errorText = await uploadResponse.text();
      console.error('ImageKit API error:', errorText);
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
