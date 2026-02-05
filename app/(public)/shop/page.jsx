"use client";
import { Suspense, useMemo, useState, useCallback } from "react";
import ProductCard from "@/components/ProductCard"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"

function ShopContent() {
    const searchParams = useSearchParams();
    const search = searchParams.get('search');
    const categoryParam = searchParams.get('category');
    const router = useRouter();
    const products = useSelector(state => state.product.list);
    const loading = useSelector(state => state.product.loading);

    const normalizeText = useCallback((value) => {
        if (value === null || value === undefined) return '';
        return String(value).toLowerCase();
    }, []);

    // Filter by search and/or category
    const filteredProducts = useMemo(() => {
        let filtered = products;

        // Filter by category if category param exists
        if (categoryParam) {
            filtered = filtered.filter(product => {
                // Convert categoryParam to normal format (e.g., "women-s-fashion" -> "Women's Fashion")
                let normalizedParam = categoryParam
                    .split('-')
                    .map((word, index) => {
                        // Handle possessive 's
                        if (word === 's' && index > 0) {
                            return "'s";
                        }
                        return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(' ')
                    .replace(/\s's\s/g, "'s "); // Ensure proper spacing around apostrophe
                
                // Check if categories array includes the category
                if (product.categories && Array.isArray(product.categories)) {
                    return product.categories.some(cat => {
                        const catValue = typeof cat === 'string' ? cat : (cat?.slug || cat?.name);
                        return catValue?.toLowerCase() === normalizedParam.toLowerCase();
                    });
                }
                // Fallback to single category field
                const productCategory = product.category?.slug || product.category?.name || product.category;
                if (!productCategory) return false;
                return productCategory.toLowerCase() === normalizedParam.toLowerCase();
            });
        }

        // Filter by search term if search param exists
        if (search) {
            const searchTerm = normalizeText(search.trim());
            filtered = filtered.filter((product) => {
                const name = normalizeText(product.name);
                const description = normalizeText(product.description || product.shortDescription);
                const brand = normalizeText(product.brand || product.brandName);
                const sku = normalizeText(product.sku);
                const categoryName = normalizeText(product.category?.name || product.category?.slug || product.category);
                const categoryList = Array.isArray(product.categories)
                    ? product.categories.map((cat) => normalizeText(cat?.name || cat?.slug || cat)).join(' ')
                    : '';
                const tags = Array.isArray(product.tags)
                    ? product.tags.map((tag) => normalizeText(tag)).join(' ')
                    : '';
                const variants = Array.isArray(product.variants)
                    ? product.variants
                        .map((variant) => normalizeText(variant?.name || variant?.title || variant?.sku))
                        .join(' ')
                    : '';

                const haystack = [
                    name,
                    description,
                    brand,
                    sku,
                    categoryName,
                    categoryList,
                    tags,
                    variants,
                ].join(' ');

                return haystack.includes(searchTerm);
            });
        }

        return filtered;
    }, [products, search, categoryParam, normalizeText]);

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
            <div className="max-w-[1250px] mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6 mt-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {pageTitle}
                    </h1>
                    <p className="text-gray-600">
                        {search ? `Results for "${search}"` : categoryParam ? `Browse ${pageTitle}` : 'Discover our complete product collection'}
                    </p>
                </div>

                {/* Products Grid - Full Width (No Sidebar) */}
                {loading ? (
                    <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
                        <p className="text-gray-500 text-lg">Loading products...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-500 text-lg mb-2">No products found.</p>
                        <p className="text-gray-400 text-sm mb-6">Try adjusting your search terms</p>
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
                            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product._id || product.id} product={product} />
                            ))}
                        </div>
                    </>
                )}
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