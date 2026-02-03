"use client";
import { Suspense, useMemo, useState, useCallback } from "react";
import ProductCard from "@/components/ProductCard"
import ProductFilterSidebar from "@/components/ProductFilterSidebar"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"

function ShopContent() {
    const searchParams = useSearchParams();
    const search = searchParams.get('search');
    const categoryParam = searchParams.get('category');
    const router = useRouter();
    const products = useSelector(state => state.product.list);
    const loading = useSelector(state => state.product.loading);
    
    const [activeFilters, setActiveFilters] = useState({
        categories: [],
        priceRange: { min: 0, max: 100000 },
        rating: 0,
        inStock: false,
        sortBy: 'popularity'
    });

    // Fuzzy match helper (Levenshtein distance)
    const levenshtein = (a, b) => {
        const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        return matrix[a.length][b.length];
    };

    // Apply filters
    const applyFilters = useCallback((productsToFilter) => {
        return productsToFilter.filter(product => {
            // Fuzzy match for search
            if (search) {
                const productName = product.name.toLowerCase();
                const searchTerm = search.toLowerCase();
                if (!productName.includes(searchTerm) && levenshtein(productName, searchTerm) > 2) {
                    return false;
                }
            }

            // Filter by URL category parameter first - more flexible matching
            if (categoryParam) {
                const productCategories = [
                    product.category,
                    ...(Array.isArray(product.categories) ? product.categories : [])
                ].filter(Boolean);
                
                // Normalize function: remove apostrophes, convert spaces/hyphens to empty, lowercase
                const normalizeCategory = (str) => {
                    if (!str || typeof str !== 'string') return '';
                    return str.toLowerCase()
                        .replace(/['\u2019`]/g, '') // remove apostrophes (straight and curly)
                        .replace(/[\s\-_]+/g, ''); // remove spaces, hyphens, underscores
                };
                
                const urlCategoryNormalized = normalizeCategory(categoryParam);
                
                const hasUrlCategory = productCategories.some(cat => {
                    // Skip if category is an ObjectId (24 character hex string)
                    if (typeof cat === 'string' && /^[a-f0-9]{24}$/i.test(cat)) {
                        return false;
                    }
                    
                    const catNormalized = normalizeCategory(cat);
                    return catNormalized === urlCategoryNormalized;
                });
                
                if (!hasUrlCategory) return false;
            }

            // Filter by selected categories from sidebar
            if (activeFilters.categories.length > 0) {
                const productCategories = [
                    product.category,
                    ...(Array.isArray(product.categories) ? product.categories : [])
                ].filter(Boolean);
                
                const hasMatchingCategory = productCategories.some(cat => 
                    activeFilters.categories.includes(cat)
                );
                if (!hasMatchingCategory) return false;
            }

            // Filter by price range
            if (product.price < activeFilters.priceRange.min || product.price > activeFilters.priceRange.max) {
                return false;
            }

            // Filter by rating
            if (activeFilters.rating > 0) {
                const avgRating = product.averageRating || 0;
                if (avgRating < activeFilters.rating) return false;
            }

            // Filter by stock availability
            if (activeFilters.inStock && product.inStock === false) {
                return false;
            }

            return true;
        });
    }, [activeFilters, search, categoryParam]);

    // Apply sorting
    const sortProducts = useCallback((productsToSort) => {
        const sorted = [...productsToSort];
        
        switch (activeFilters.sortBy) {
            case 'price-low-high':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high-low':
                return sorted.sort((a, b) => b.price - a.price);
            case 'newest':
                return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            case 'rating':
                return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
            case 'discount':
                return sorted.sort((a, b) => {
                    const discountA = a.mrp > a.price ? ((a.mrp - a.price) / a.mrp * 100) : 0;
                    const discountB = b.mrp > b.price ? ((b.mrp - b.price) / b.mrp * 100) : 0;
                    return discountB - discountA;
                });
            case 'popularity':
            default:
                return sorted.sort((a, b) => {
                    const aRatings = a.rating?.length || 0;
                    const bRatings = b.rating?.length || 0;
                    return bRatings - aRatings;
                });
        }
    }, [activeFilters.sortBy]);

    const filteredAndSortedProducts = useMemo(() => {
        const filtered = applyFilters(products);
        
        // Debug: Log categories for troubleshooting
        if (categoryParam) {
            const allCategories = products.map(p => p.category).filter(Boolean);
            const uniqueCategories = [...new Set(allCategories)];
            console.log('🔍 Category Filter Debug:');
            console.log('URL Category:', categoryParam);
            console.log('Available categories in products:', uniqueCategories);
            console.log('Sample product categories:', products.slice(0, 3).map(p => ({ name: p.name, category: p.category, type: typeof p.category })));
            console.log('Filtered products count:', filtered.length);
        }
        
        return sortProducts(filtered);
    }, [products, applyFilters, sortProducts, categoryParam]);

    const handleFilterChange = useCallback((filters) => {
        setActiveFilters(filters);
    }, []);

    // Get display title
    const pageTitle = useMemo(() => {
        if (search) return `Search: ${search}`;
        if (categoryParam) {
            return categoryParam.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
        return 'All Products';
    }, [search, categoryParam]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1400px] mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6 mt-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {pageTitle}
                    </h1>
                    <p className="text-gray-600">
                        {search ? `Results for "${search}"` : categoryParam ? `Browse ${pageTitle}` : 'Discover our complete product collection'}
                    </p>
                </div>

                <div className="flex gap-6">
                    {/* Filter Sidebar */}
                    <ProductFilterSidebar 
                        products={products}
                        onFilterChange={handleFilterChange}
                        initialFilters={activeFilters}
                    />
                    
                    {/* Products Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
                                <p className="text-gray-500 text-lg">Loading products...</p>
                            </div>
                        ) : filteredAndSortedProducts.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                                <p className="text-gray-500 text-lg mb-2">No products found.</p>
                                <p className="text-gray-400 text-sm mb-6">Try adjusting your filters or search terms</p>
                                <button 
                                    onClick={() => router.push('/shop')}
                                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                                >
                                    View All Products
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 text-sm text-gray-600">
                                    Showing {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                                    {filteredAndSortedProducts.map((product) => (
                                        <ProductCard key={product._id || product.id} product={product} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Shop() {
  return (
    <Suspense fallback={<div>Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}