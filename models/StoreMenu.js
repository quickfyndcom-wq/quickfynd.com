import mongoose from 'mongoose';

const StoreMenuSchema = new mongoose.Schema({
  storeId: {
    type: String,
    required: true,
    unique: true
  },
  categories: [{
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.StoreMenu || mongoose.model('StoreMenu', StoreMenuSchema);
