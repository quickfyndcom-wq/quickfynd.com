import dbConnect from '@/lib/mongodb';
import CategorySlider from '@/models/CategorySlider';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';

function parseAuthHeader(req) {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;
  const parts = auth.split(' ');
  return parts.length === 2 ? parts[1] : null;
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const token = parseAuthHeader(req);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    const storeId = decoded.uid;
    const { id } = params;

    const { title, productIds } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const slider = await CategorySlider.findOneAndUpdate(
      { _id: id, storeId },
      {
        title: title.trim(),
        productIds,
      },
      { new: true }
    );

    if (!slider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Slider updated', slider },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating category slider:', error);
    return NextResponse.json(
      { error: 'Failed to update slider' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const token = parseAuthHeader(req);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    const storeId = decoded.uid;
    const { id } = params;

    const slider = await CategorySlider.findOneAndDelete({ _id: id, storeId });

    if (!slider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Slider deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting category slider:', error);
    return NextResponse.json(
      { error: 'Failed to delete slider' },
      { status: 500 }
    );
  }
}
