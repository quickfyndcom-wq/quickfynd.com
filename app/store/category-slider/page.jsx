'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiEdit2, FiX, FiSearch } from 'react-icons/fi';
import Loading from '@/components/Loading';

export default function CategorySliderPage() {
  const { user, getToken } = useAuth();
  const [sliders, setSliders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    productIds: [],
  });

  const normalizeId = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value.$oid) return value.$oid;
      const str = value.toString?.();
      return str && str !== '[object Object]' ? str : null;
    }
    return null;
  };

  // Fetch sliders and products
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      // Fetch existing sliders
      const slidersRes = await axios.get('/api/store/featured-sections', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const normalizedSliders = (slidersRes.data.sections || []).map(section => {
        const rawId = section.id || section._id;
        const normalizedId = normalizeId(rawId);

        return {
          ...section,
          id: normalizedId
        };
      });
      setSliders(normalizedSliders);

      // Fetch store products
      const productsRes = await axios.get('/api/store/product', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Normalize product IDs (convert _id to id if needed)
      const normalizedProducts = (productsRes.data.products || []).map(p => ({
        ...p,
        id: p.id || p._id || p.productId
      }));
      
      setProducts(normalizedProducts);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      setLoading(false);
    }
  };

  const handleAddSlider = () => {
    setFormData({ title: '', productIds: [] });
    setEditingIdx(null);
    setShowForm(true);
  };

  const handleEditSlider = (slider) => {
    const sliderId = normalizeId(slider.id || slider._id);
    setFormData({ 
      _id: sliderId,
      title: slider.title, 
      productIds: slider.productIds 
    });
    setEditingIdx(sliderId);
    setShowForm(true);
  };

  const handleSaveSlider = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a slider title');
      return;
    }
    if (formData.productIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    try {
      const token = await getToken();

      if (editingIdx !== null) {
        const editId = normalizeId(editingIdx);
        if (!editId || editId === 'undefined' || editId === 'null') {
          toast.error('Invalid slider ID');
          return;
        }
        // Update existing slider
        await axios.put(
          `/api/store/featured-sections/${encodeURIComponent(String(editId))}`,
          { title: formData.title, productIds: formData.productIds },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Slider updated successfully');
      } else {
        // Create new slider
        await axios.post('/api/store/featured-sections', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Slider created successfully');
      }

      setShowForm(false);
      setEditingIdx(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving slider:', error);
      toast.error('Failed to save slider');
    }
  };

  const handleDeleteSlider = async (sliderId) => {
    if (!confirm('Delete this slider?')) return;

    const deleteId = normalizeId(sliderId);
    if (!deleteId || deleteId === 'undefined' || deleteId === 'null') {
      toast.error('Invalid slider ID');
      return;
    }

    try {
      const token = await getToken();
      try {
        await axios.delete('/api/store/featured-sections', {
          headers: { Authorization: `Bearer ${token}` },
          params: { id: String(deleteId) },
        });
      } catch (err) {
        if (err?.response?.status === 404) {
          await axios.delete(`/api/store/featured-sections/${encodeURIComponent(String(deleteId))}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          throw err;
        }
      }
      toast.success('Slider deleted');
      await fetchData();
    } catch (error) {
      console.error('Error deleting slider:', error);
      const message = error?.response?.data?.error || 'Failed to delete slider';
      toast.error(message);
    }
  };

  const toggleProductSelection = (productId) => {
    if (!productId) return; // Safety check
    
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId]
    }));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Category Sliders</h1>
          <p className="text-gray-600">Create and manage product sliders for your store</p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Sliders List */}
          <div className="lg:col-span-2">
            {sliders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-gray-300">
                <p className="text-xl text-gray-500 font-semibold mb-2">No sliders yet</p>
                <p className="text-gray-400 mb-6">Create your first slider to get started</p>
                <button
                  onClick={handleAddSlider}
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold transition"
                >
                  <FiPlus size={20} /> Create First Slider
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sliders.map((slider) => (
                  <div key={slider.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{slider.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">📦 {slider.productIds.length} products</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSlider(slider)}
                          className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition"
                          title="Edit"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteSlider(slider.id)}
                          className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slider.productIds.slice(0, 4).map(pid => {
                        const prod = products.find(p => p.id === pid);
                        return prod ? (
                          <span key={pid} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                            {prod.name.substring(0, 25)}...
                          </span>
                        ) : null;
                      })}
                      {slider.productIds.length > 4 && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
                          +{slider.productIds.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              {/* Form Header */}
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {showForm ? (editingIdx !== null ? '✏️ Edit Slider' : '➕ New Slider') : '+ Create'}
              </h2>

              {!showForm ? (
                <button
                  onClick={handleAddSlider}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg hover:shadow-lg font-semibold transition"
                >
                  Create New Slider
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Slider Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Best Electronics"
                      className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>

                  {/* Selected Count */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-sm font-semibold text-blue-900">Products Selected</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{formData.productIds.length}</p>
                  </div>

                  {/* Search Products */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Search Products
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>

                  {/* Products List */}
                  <div className="border-2 border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product, idx) => (
                        <label
                          key={product.id || idx}
                          className="flex items-start gap-3 p-2 cursor-pointer hover:bg-gray-50 rounded transition"
                        >
                          <input
                            type="checkbox"
                            checked={formData.productIds.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="w-4 h-4 mt-1 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 line-clamp-2">
                              {product.name}
                            </p>
                            {product.basePrice && (
                              <p className="text-xs text-green-600 font-bold mt-1">
                                ₹{product.basePrice?.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="text-center text-gray-400 text-sm py-4">No products found</p>
                    )}
                  </div>

                  {/* Clear All Button */}
                  {formData.productIds.length > 0 && (
                    <button
                      onClick={() => setFormData({ ...formData, productIds: [] })}
                      className="w-full text-red-600 border-2 border-red-200 py-2 rounded-lg hover:bg-red-50 font-semibold transition text-sm"
                    >
                      Clear All
                    </button>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t-2 border-gray-200">
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setSearchQuery('');
                      }}
                      className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSlider}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg font-semibold transition text-sm"
                    >
                      {editingIdx !== null ? '💾 Update' : '✨ Create'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
