import mongoose from "mongoose";

const AbandonedCartSchema = new mongoose.Schema({
  storeId: { type: String, required: true },
  userId: String,
  name: String,
  email: String,
  phone: String,
  address: Object,
  items: Array,
  cartTotal: Number,
  currency: String,
  lastSeenAt: Date,
  source: { type: String, default: 'checkout' },
}, { timestamps: true });

export default mongoose.models.AbandonedCart || mongoose.model("AbandonedCart", AbandonedCartSchema);
