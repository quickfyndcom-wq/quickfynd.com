'use client'
import React, { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { useSelector } from 'react-redux'

const Section4 = ({ sections }) => {
  const router = useRouter()
  const products = useSelector(state => state.product.list)

  if (!sections || sections.length === 0) return null

  return (
    <div className="w-full bg-white py-6 px-4">
      <div className="space-y-8">
        {sections.map((section, sectionIdx) => (
          <HorizontalSlider key={section._id || sectionIdx} section={section} router={router} allProducts={products} />
        ))}
      </div>
    </div>
  )
}

const SkeletonLoader = () => {
  return (
    <>
      {[...Array(5)].map((_, idx) => (
        <div
          key={idx}
          className="flex-shrink-0 w-48 sm:w-56 bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse"
        >
          {/* Skeleton Image */}
          <div className="w-full h-56 sm:h-64 bg-gray-300"></div>

          {/* Skeleton Info */}
          <div className="p-4 space-y-3">
            {/* Name skeleton */}
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>

            {/* Brand skeleton */}
            <div className="h-3 bg-gray-300 rounded w-1/3"></div>

            {/* Price skeleton */}
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>

            {/* Rating skeleton */}
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </>
  )
}

const HorizontalSlider = ({ section, router, allProducts }) => {
  const scrollRef = useRef(null)
  const [sectionProducts, setSectionProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const dragStateRef = useRef({ isDragging: false, startX: 0, scrollLeft: 0, rafId: null })

  const getCurrentPrice = (product) => product.basePrice ?? product.price ?? product.salePrice
  const getRegularPrice = (product) => product.originalPrice ?? product.mrp ?? product.regularPrice ?? product.price
  const getDiscountPercent = (regular, current) => {
    if (!regular || !current || regular <= current) return null
    return Math.round(((regular - current) / regular) * 100)
  }
  const isFastDelivery = (product) => Boolean(product.fastDelivery || product.isFastDelivery || product.deliveryFast || product.express)

  useEffect(() => {
    setLoading(true)
    
    // Simulate fetch delay for better UX
    const timer = setTimeout(() => {
      let featured = []
      
      // If section already has products array, use it (section4 format)
      if (section.products && Array.isArray(section.products) && section.products.length > 0) {
        featured = section.products
      }
      // If section has productIds, filter from allProducts (featured sections format)
      else if (section.productIds && Array.isArray(section.productIds)) {
        featured = allProducts.filter(p => {
          const productId = p.id || p._id || p.productId
          return section.productIds.includes(productId)
        })
      }
      
      setSectionProducts(featured)
      setLoading(false)
    }, 800) // 800ms delay for skeleton display
    
    return () => clearTimeout(timer)
  }, [allProducts, section])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const updateScrollState = () => {
      setCanScrollLeft(container.scrollLeft > 0)
    }

    updateScrollState()
    container.addEventListener('scroll', updateScrollState, { passive: true })

    return () => container.removeEventListener('scroll', updateScrollState)
  }, [sectionProducts, loading])

  // Mouse drag handlers
  const handlePointerDown = (e) => {
    const container = scrollRef.current
    if (!container) return

    container.setPointerCapture?.(e.pointerId)
    container.style.scrollBehavior = 'auto'
    dragStateRef.current.isDragging = true
    dragStateRef.current.startX = e.clientX
    dragStateRef.current.scrollLeft = container.scrollLeft
    setIsDragging(true)
  }

  const handlePointerMove = (e) => {
    const container = scrollRef.current
    if (!container || !dragStateRef.current.isDragging) return

    e.preventDefault()
    const walk = (e.clientX - dragStateRef.current.startX) * 1.5

    if (dragStateRef.current.rafId) {
      cancelAnimationFrame(dragStateRef.current.rafId)
    }

    dragStateRef.current.rafId = requestAnimationFrame(() => {
      container.scrollLeft = dragStateRef.current.scrollLeft - walk
    })
  }

  const endDragging = (e) => {
    const container = scrollRef.current
    dragStateRef.current.isDragging = false
    if (dragStateRef.current.rafId) {
      cancelAnimationFrame(dragStateRef.current.rafId)
      dragStateRef.current.rafId = null
    }
    if (container) {
      container.style.scrollBehavior = 'smooth'
      if (e?.pointerId != null) {
        container.releasePointerCapture?.(e.pointerId)
      }
    }
    setIsDragging(false)
  }

  const scrollLeftBtn = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRightBtn = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  if (sectionProducts.length === 0 && !loading) return null

  return (
    <div className="w-full mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-lg sm:text-2xl md:text-3xl font-light text-gray-900">{section.title || section.category}</h3>
      
      </div>

      {/* Horizontal Scrollable Container */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={scrollLeftBtn}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Products Scroll Container */}
        <div
          ref={scrollRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDragging}
          onPointerLeave={endDragging}
          onPointerCancel={endDragging}
          className={`flex gap-4 overflow-x-auto scrollbar-hide pb-2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ scrollBehavior: 'smooth', touchAction: 'pan-y' }}
        >
          {loading ? (
            <SkeletonLoader />
          ) : (
            sectionProducts.map((product) => (
            <div
              key={product._id || product.id}
              onClick={() => router.push(`/product/${product.slug || product.id}`)}
              onDragStart={(e) => e.preventDefault()}
              draggable="false"
              className="flex-shrink-0 w-48 sm:w-56 bg-white border border-gray-200 rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 select-none"
            >
              {/* Product Image - Larger */}
              <div className="relative w-full h-56 sm:h-64 bg-gray-100 overflow-hidden rounded-t-xl">
                {product.image || product.images?.[0] ? (
                  <Image
                    src={product.image || product.images?.[0]}
                    alt={product.name}
                    fill
                    draggable="false"
                    className="object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none select-none"
                    sizes="(max-width: 640px) 192px, 224px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-sm">No image</span>
                  </div>
                )}
              </div>

              {/* Product Info - Clean Layout */}
              <div className="p-4 space-y-2">
                {/* Name */}
                <h4 className="font-semibold text-sm sm:text-base line-clamp-2 text-gray-900 group-hover:text-indigo-600 transition">
                  {product.name}
                </h4>

                {/* Brand */}
                {product.brand && (
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</p>
                )}

                {/* Price - More Details */}
                {(() => {
                  const currentPrice = getCurrentPrice(product)
                  const regularPrice = getRegularPrice(product)
                  const discountPercent = getDiscountPercent(regularPrice, currentPrice)

                  return (
                    <div className="pt-1 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg sm:text-xl font-bold text-gray-900">
                          ₹{currentPrice?.toLocaleString?.() || currentPrice}
                        </span>
                        {regularPrice && regularPrice > currentPrice && (
                          <span className="text-xs sm:text-sm text-gray-400 line-through">
                            ₹{regularPrice?.toLocaleString?.() || regularPrice}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {discountPercent ? (
                          <span className="text-xs sm:text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {discountPercent}% OFF
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-500">Regular price</span>
                        )}
                        {isFastDelivery(product) && (
                          <span className="text-xs sm:text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            Fast delivery
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Rating */}
                {product.rating && (
                  <div className="pt-2">
                    <span className="inline-block text-xs sm:text-sm bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                      ★ {product.rating}
                    </span>
                  </div>
                )}
              </div>
            </div>
            ))
          )}
        </div>

        {/* Right Arrow */}
        <button
          onClick={scrollRightBtn}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  )
}

export default Section4