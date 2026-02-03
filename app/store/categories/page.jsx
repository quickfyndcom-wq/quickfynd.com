'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiEdit2 } from 'react-icons/fi';
import Loading from '@/components/Loading';

const MAX_CATEGORIES = 10;

export default function StoreCategoryMenu() {
  const { user, getToken } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    url: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Fetch categories from store
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get('/api/store/category-menu', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(data.categories || []);
    } catch (error) {
      console.log('First load or no categories yet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save category
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      toast.error('Name and URL are required');
      return;
    }

    if (!imageFile && !formData.image) {
      toast.error('Image is required');
      return;
    }

    try {
      setUploading(true);
      const token = await getToken();
      let imageUrl = formData.image;

      // Upload image if new file selected
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        const uploadRes = await axios.post('/api/upload', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        imageUrl = uploadRes.data.url;
      }

      const updatedCategory = {
        name: formData.name,
        image: imageUrl,
        url: formData.url,
      };

      let newCategories;
      if (editingIdx !== null) {
        // Update existing
        newCategories = [...categories];
        newCategories[editingIdx] = updatedCategory;
        toast.success('Category updated');
      } else {
        // Add new
        if (categories.length >= MAX_CATEGORIES) {
          toast.error(`Maximum ${MAX_CATEGORIES} categories allowed`);
          setUploading(false);
          return;
        }
        newCategories = [...categories, updatedCategory];
        toast.success('Category added');
      }

      // Save to backend
      await axios.post('/api/store/category-menu', { categories: newCategories }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategories(newCategories);
      setFormData({ name: '', image: '', url: '' });
      setImageFile(null);
      setImagePreview('');
      setShowForm(false);
      setEditingIdx(null);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to save category');
    } finally {
      setUploading(false);
    }
  };

  // Edit category
  const handleEdit = (idx) => {
    const cat = categories[idx];
    setFormData({
      name: cat.name,
      image: cat.image,
      url: cat.url,
    });
    setImagePreview(cat.image);
    setEditingIdx(idx);
    setShowForm(true);
  };

  // Delete category
  const handleDelete = async (idx) => {
    if (!confirm('Remove this category?')) return;
    try {
      const token = await getToken();
      const newCategories = categories.filter((_, i) => i !== idx);
      
      await axios.post('/api/store/category-menu', { categories: newCategories }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategories(newCategories);
      toast.success('Category removed');
    } catch (error) {
      toast.error('Failed to remove category');
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingIdx(null);
    setFormData({ name: '', image: '', url: '' });
    setImageFile(null);
    setImagePreview('');
  };

  if (loading) return <Loading />;
  if (!user) return <div className="p-6 text-red-500">Please login</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Store Category Menu</h1>
            <p className="text-slate-600 mt-2">Create a custom category menu (Max {MAX_CATEGORIES} items)</p>
          </div>
          {!showForm && categories.length < MAX_CATEGORIES && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FiPlus /> Add Category
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">
              {editingIdx !== null ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Women's Fashion"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category URL *
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="e.g., /shop?category=women-s-fashion"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-slate-700 mb-4">
                  Category Image *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg cursor-pointer"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Recommended: 150x150px square image
                    </p>
                  </div>
                  {imagePreview && (
                    <div className="flex justify-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-40 h-40 object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {uploading ? 'Saving...' : editingIdx !== null ? 'Update' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 bg-white rounded-lg p-8 text-center text-slate-500">
              <p className="text-lg">No categories yet</p>
              <p className="text-sm mt-2">Create your first category to display on your store</p>
            </div>
          ) : (
            categories.map((cat, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                <div className="mb-4">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2 truncate">{cat.name}</h3>
                <p className="text-xs text-blue-600 mb-4 truncate break-all">{cat.url}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(idx)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm"
                  >
                    <FiEdit2 size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(idx)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm"
                  >
                    <FiTrash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Progress */}
        {categories.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-slate-600">
              {categories.length} of {MAX_CATEGORIES} categories
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(categories.length / MAX_CATEGORIES) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
