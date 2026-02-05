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

export async function GET(req) {
  try {
    await dbConnect();
    const token = parseAuthHeader(req);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    const storeId = decoded.uid;

    const sliders = await CategorySlider.find({ storeId }).lean();

    return NextResponse.json({ sliders: sliders || [] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching category sliders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sliders' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const token = parseAuthHeader(req);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    const storeId = decoded.uid;

    const { title, productIds } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one product is required' },
        { status: 400 }
      );
    }

    const slider = new CategorySlider({
      storeId,
      title: title.trim(),
      productIds,
    });

    await slider.save();

    return NextResponse.json(
      { message: 'Slider created', slider },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category slider:', error);
    return NextResponse.json(
      { error: 'Failed to create slider' },
      { status: 500 }
    );
  }
}
