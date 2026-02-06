import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import AbandonedCart from '@/models/AbandonedCart';

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, customer, userId, cartTotal, currency } = body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    await dbConnect();

    const productIds = items.map(it => it.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id storeId name price')
      .lean();

    const productMap = new Map(products.map(p => [String(p._id), p]));

    // Group items by storeId
    const grouped = new Map();
    for (const it of items) {
      const prod = productMap.get(String(it.productId));
      if (!prod?.storeId) continue;
      const storeId = String(prod.storeId);
      if (!grouped.has(storeId)) grouped.set(storeId, []);
      grouped.get(storeId).push({
        productId: it.productId,
        name: it.name || prod.name,
        quantity: it.quantity || 1,
        price: it.price || prod.price || 0,
        variantOptions: it.variantOptions || null,
      });
    }

    const now = new Date();
    const identifier = userId || customer?.email || customer?.phone || null;

    for (const [storeId, storeItems] of grouped.entries()) {
      const filter = { storeId };
      if (identifier) {
        filter.$or = [
          ...(userId ? [{ userId }] : []),
          ...(customer?.email ? [{ email: customer.email.toLowerCase() }] : []),
          ...(customer?.phone ? [{ phone: customer.phone }] : []),
        ];
      }

      await AbandonedCart.updateOne(
        filter,
        {
          $set: {
            storeId,
            userId: userId || null,
            name: customer?.name || null,
            email: customer?.email?.toLowerCase() || null,
            phone: customer?.phone || null,
            address: customer?.address || null,
            items: storeItems,
            cartTotal: typeof cartTotal === 'number' ? cartTotal : null,
            currency: currency || null,
            lastSeenAt: now,
            source: 'checkout',
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[abandoned-checkout] error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}