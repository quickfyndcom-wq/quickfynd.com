import { connectDB } from '@/lib/db';
import Category from '@/models/Category';
import { verifyAdminToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await connectDB();
    const categories = await Category.find().sort({ createdAt: -1 });
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();

    const existingCategory = await Category.findOne({ slug: data.slug });
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }

    const category = new Category({
      name: data.name,
      slug: data.slug,
      image: data.image,
      url: data.url,
      description: data.description,
    });

    await category.save();
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
