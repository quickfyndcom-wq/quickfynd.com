import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
});

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

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: `${userId}/${fileName}`,
      folder: '/quickfynd/home-categories',
      tags: ['home-category', userId],
    });

    console.log('Image uploaded to ImageKit:', uploadResponse.url);

    return NextResponse.json(
      {
        url: uploadResponse.url,
        fileId: uploadResponse.fileId,
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
