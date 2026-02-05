import dbConnect from '@/lib/mongodb';
import FeaturedSection from '@/models/FeaturedSection';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await dbConnect();

    const sections = await FeaturedSection.find({}).lean();

    return NextResponse.json({ sections: sections || [] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching featured sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}
