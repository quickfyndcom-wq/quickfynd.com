import dbConnect from '@/lib/mongodb';
import StoreMenu from '@/models/StoreMenu';
import { getAuth } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

function parseAuthHeader(req) {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;
  const parts = auth.split(' ');
  return parts.length === 2 ? parts[1] : null;
}

export async function GET(request) {
  try {
    const token = parseAuthHeader(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const firebaseAuth = getAuth();
    const decoded = await firebaseAuth.verifyIdToken(token);
    const userId = decoded.uid;

    await dbConnect();
    const storeMenu = await StoreMenu.findOne({ storeId: userId });
    
    return NextResponse.json({ 
      categories: storeMenu?.categories || []
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const token = parseAuthHeader(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const firebaseAuth = getAuth();
    const decoded = await firebaseAuth.verifyIdToken(token);
    const userId = decoded.uid;

    await dbConnect();
    const { categories } = await request.json();

    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Categories must be an array' },
        { status: 400 }
      );
    }

    if (categories.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 categories allowed' },
        { status: 400 }
      );
    }

    const storeMenu = await StoreMenu.findOneAndUpdate(
      { storeId: userId },
      { 
        storeId: userId,
        categories: categories
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ storeMenu }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
