import { connectDB } from '@/lib/db';
import Category from '@/models/Category';
import { verifyAdminToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function PUT(request, { params }) {
  try {
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = params;
    const data = await request.json();

    // Check if slug is taken by another category
    if (data.slug) {
      const existingCategory = await Category.findOne({
        slug: data.slug,
        _id: { $ne: new ObjectId(id) },
      });
      if (existingCategory) {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        name: data.name,
        slug: data.slug,
        image: data.image,
        url: data.url,
        description: data.description,
      },
      { new: true }
    );

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
