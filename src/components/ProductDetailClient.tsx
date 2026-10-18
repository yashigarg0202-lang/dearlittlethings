'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/lib/currency';

interface ProductImageItem {
  id: string;
  url: string;
  altText: string;
}

interface ProductVariantItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  optionValues?: string | null;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    materials?: string | null;
    dimensions?: string | null;
    careInstructions?: string | null;
    isHandmade: boolean;
    productionTime?: string | null;
    variationDisclaimer?: string | null;
    shippingNotes?: string | null;
    category: { name: string; slug: string };
    images: ProductImageItem[];
    variants: ProductVariantItem[];
  };
  shippingRates: {
    name: string;
    rate: number;
    estimatedDaysMin: number | null;
    estimatedDaysMax: number | null;
  }[];
}

export default function ProductDetailClient({
  product,
  shippingRates,
}: ProductDetailClientProps) {
  const { addToCart, isLoading } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariantItem>(
    product.variants[0] || {
      id: '',
      name: 'Default',
      sku: '',
      price: 0,
      compareAtPrice: null,
      stock: 0,
    }
  );

  const initialIdx = product.images.findIndex((img) => (img as { isPrimary?: boolean }).isPrimary);
  const [selectedImageIndex, setSelectedImageIndex] = useState(initialIdx >= 0 ? initialIdx : 0);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const images = product.images.length > 0 ? product.images : [
    { id: '1', url: '/placeholders/product-stickers-1.svg', altText: product.title },
  ];

  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (selectedVariant.stock <= 0 || isAdding) return;
    setIsAdding(true);
    try {
      const res = await addToCart(selectedVariant.id, quantity);
      if (res.success) {
        setAddedNotice(true);
        setTimeout(() => setAddedNotice(false), 2500);
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div>
      {/* Back to Collection Link */}
      <div style={{ marginBottom: '2.5rem' }}>
        <Link
          href="/shop"
          className="link-quiet"
          style={{
            fontSize: '0.875rem',
            color: 'var(--muted-foreground)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>&larr;</span>
          <span>back to collection</span>
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '4.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left: Product Images with paper-frame */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            className="paper-frame"
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 5',
              overflow: 'hidden',
              backgroundColor: 'var(--muted)',
            }}
          >
            <Image
              src={images[selectedImageIndex]?.url || images[0].url}
              alt={images[selectedImageIndex]?.altText || product.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
            />
          </div>

          {/* Thumbnails if multiple images exist */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {images.map((img: ProductImageItem, idx: number) => (
                <button
                  type="button"
                  key={img.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedImageIndex(idx);
                  }}
                  aria-label={`View photo ${idx + 1}`}
                  className="paper-frame"
                  style={{
                    position: 'relative',
                    width: '76px',
                    height: '95px',
                    border: selectedImageIndex === idx ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    padding: 0,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    opacity: selectedImageIndex === idx ? 1 : 0.65,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Image src={img.url} alt={img.altText} fill sizes="76px" style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Add to Bag Console */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Category Tag */}
          <p
            className="font-accent"
            style={{
              fontSize: '1.25rem',
              color: 'var(--primary)',
              margin: '0 0 0.5rem 0',
            }}
          >
            the collection / {product.category.name.toLowerCase()}
          </p>

          {/* Title */}
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2.25rem, 4vw, 3.25rem)',
              lineHeight: 1.1,
              margin: '0 0 1rem 0',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--foreground)',
            }}
          >
            {product.title}
          </h1>

          {/* Price in INR */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '2rem' }}>
            <span
              style={{
                fontSize: '1.75rem',
                fontWeight: 400,
                color: 'var(--foreground)',
                fontFamily: 'var(--font-serif)',
              }}
            >
              {formatINR(selectedVariant.price)}
            </span>
            {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
              <span
                style={{
                  fontSize: '1.15rem',
                  color: 'var(--muted-foreground)',
                  textDecoration: 'line-through',
                }}
              >
                {formatINR(selectedVariant.compareAtPrice)}
              </span>
            )}
            <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
              tax included &bull; request &amp; confirm
            </span>
          </div>

          {/* Description */}
          {/* Product Description */}
          {/<[a-z][\s\S]*>/i.test(product.description) ? (
            <div
              style={{
                fontSize: '1rem',
                lineHeight: '1.75',
                color: 'var(--muted-foreground)',
                marginBottom: '2.5rem',
                fontFamily: 'var(--font-sans)',
              }}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : (
            <p
              style={{
                fontSize: '1rem',
                lineHeight: '1.75',
                color: 'var(--muted-foreground)',
                marginBottom: '2.5rem',
                fontFamily: 'var(--font-sans)',
                whiteSpace: 'pre-line',
              }}
            >
              {product.description}
            </p>
          )}

          {/* Variant Selector Pills if more than 1 variant */}
          {product.variants.length > 1 && (
            <div style={{ marginBottom: '2rem' }}>
              <span
                style={{
                  fontSize: '0.8125rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--muted-foreground)',
                  display: 'block',
                  marginBottom: '0.6rem',
                }}
              >
                select edition: <strong style={{ color: 'var(--foreground)' }}>{selectedVariant.name}</strong>
              </span>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {product.variants.map((v: ProductVariantItem) => {
                  const isSelected = selectedVariant.id === v.id;
                  return (
                    <button
                      type="button"
                      key={v.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedVariant(v);
                        setQuantity(1);
                      }}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '9999px',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                        color: isSelected ? 'var(--primary-foreground)' : 'var(--foreground)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stepper + Add to Bag Pill */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '2.5rem',
            }}
          >
            {/* Quantity Stepper */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid var(--border)',
                borderRadius: '9999px',
                padding: '0 0.5rem',
                height: '48px',
                backgroundColor: 'var(--background)',
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuantity((q: number) => Math.max(1, q - 1));
                }}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                style={{
                  width: '32px',
                  height: '100%',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '1.15rem',
                  color: 'var(--foreground)',
                }}
              >
                &minus;
              </button>
              <span
                style={{
                  width: '32px',
                  textAlign: 'center',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'var(--foreground)',
                }}
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuantity((q: number) => Math.min(selectedVariant.stock, q + 1));
                }}
                disabled={quantity >= selectedVariant.stock}
                aria-label="Increase quantity"
                style={{
                  width: '32px',
                  height: '100%',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '1.15rem',
                  color: 'var(--foreground)',
                }}
              >
                +
              </button>
            </div>

            {/* Add to Bag Pill Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart();
              }}
              disabled={isLoading || isAdding || selectedVariant.stock <= 0}
              className="btn-ink"
              style={{
                flex: 1,
                height: '48px',
                fontSize: '0.95rem',
                border: 'none',
                cursor: selectedVariant.stock <= 0 ? 'not-allowed' : 'pointer',
                opacity: selectedVariant.stock <= 0 ? 0.6 : 1,
              }}
            >
              {selectedVariant.stock <= 0 ? 'sold out in studio' : isAdding || isLoading ? 'adding...' : '+ add to bag'}
            </button>
          </div>

          {/* Feedback message */}
          {addedNotice && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '0.875rem',
                color: 'var(--primary)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>&check;</span>
              <span>added {quantity} &times; {product.title} to your bag</span>
            </div>
          )}

          {/* Artisanal Studio Note */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: 'rgba(244, 239, 235, 0.6)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              marginBottom: '2.5rem',
            }}
          >
            <p
              className="font-accent"
              style={{
                fontSize: '1.25rem',
                color: 'var(--primary)',
                margin: '0 0 0.25rem 0',
              }}
            >
              a studio note
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
                lineHeight: '1.6',
                margin: 0,
              }}
            >
              {product.variationDisclaimer ||
                'each piece is designed in our studio, printed on matte waterproof vinyl, and trimmed with care. subtle variations are part of slow studio making.'}
            </p>
          </div>

          {/* Specifications Accordion / Details */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              fontSize: '0.875rem',
              color: 'var(--muted-foreground)',
              lineHeight: '1.6',
            }}
          >
            {product.materials && (
              <div>
                <strong style={{ color: 'var(--foreground)' }}>materials: </strong>
                {product.materials}
              </div>
            )}
            {product.dimensions && (
              <div>
                <strong style={{ color: 'var(--foreground)' }}>dimensions: </strong>
                {product.dimensions}
              </div>
            )}
            {product.careInstructions && (
              <div>
                <strong style={{ color: 'var(--foreground)' }}>care: </strong>
                {product.careInstructions}
              </div>
            )}
            <div>
              <strong style={{ color: 'var(--foreground)' }}>order &amp; delivery: </strong>
              orders are submitted as personal requests. We confirm availability and arrange payment directly before dispatch.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
