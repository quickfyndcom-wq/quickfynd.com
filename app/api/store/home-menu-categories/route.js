import dbConnect from '@/lib/mongodb';
import HomeMenuCategorySettings from '@/models/HomeMenuCategorySettings';
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

    // Simply return the most recently saved configuration
    // No authentication required for reading public home menu categories
    const settings = await HomeMenuCategorySettings.findOne({}).sort({ updatedAt: -1 }).lean();

    return NextResponse.json({
      count: settings?.count || 6,
      items: settings?.items || [],
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching home menu categories:', error);
    return NextResponse.json(
      { count: 6, items: [] },
      { status: 200 }
    );
  }
}

export async function POST(req) {
  try {
    const token = parseAuthHeader(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    const userId = decoded.uid;

    await dbConnect();

    const { count, items } = await req.json();

    if (!count || ![6, 8, 10, 12, 14].includes(count)) {
      return NextResponse.json(
        { error: 'Invalid item count. Must be 6, 8, 10, 12, or 14.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    items.forEach((item, index) => {
      if (!item.name || !item.name.trim()) {
        throw new Error(`Item ${index + 1}: Name is required`);
      }
      if (!item.image) {
        throw new Error(`Item ${index + 1}: Image is required`);
      }
    });

    const settings = await HomeMenuCategorySettings.findOneAndUpdate(
      { storeId: userId },
      {
        storeId: userId,
        count,
        items: items.map((item) => ({
          name: item.name,
          image: item.image,
          url: item.url || null,
          categoryId: item.categoryId || null,
        })),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: 'Configuration saved successfully',
      data: {
        count: settings.count,
        items: settings.items,
      },
    });
  } catch (error) {
    console.error('Error saving home menu categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
