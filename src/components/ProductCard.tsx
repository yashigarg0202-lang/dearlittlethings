'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/lib/currency';

export interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  images: { url: string; altText: string }[];
  variants: {
    id: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    name: string;
  }[];
  index?: number;
  categoryName?: string | null;
  isHandmade?: boolean;
  productionTime?: string | null;
}

export default function ProductCard({
  id,
  title,
  slug,
  description,
  images,
  variants,
  index = 0,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const primaryImage = images[0] || {
    url: '/placeholders/product-stickers-1.svg',
    altText: title,
  };

  const defaultVariant = variants[0];
  const price = defaultVariant ? defaultVariant.price : 0;
  const isAvailable = variants.some((v) => v.stock > 0);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant || !isAvailable) return;

    try {
      await addToCart(defaultVariant.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add to bag:', err);
    }
  };

  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
      className={`group ${index % 3 === 1 ? 'stagger-col-2' : ''}`}
    >
      <Link href={`/product/${slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        {/* Paper Frame Image Container */}
        <div
          className="paper-frame"
          style={{
            aspectRatio: '4 / 5',
            overflow: 'hidden',
            backgroundColor: 'var(--card)',
          }}
        >
          <img
            src={primaryImage.url}
            alt={primaryImage.altText || title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'block',
            }}
            className="group-hover-zoom"
          />
        </div>

        {/* Title and Price */}
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <h3
            className="font-display"
            style={{
              fontSize: '1.25rem',
              lineHeight: 1.25,
              margin: 0,
              color: 'var(--foreground)',
              fontWeight: 400,
            }}
          >
            {title}
          </h3>
          <span
            style={{
              fontSize: '0.875rem',
              color: 'var(--foreground)',
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatINR(price)}
          </span>
        </div>

        {/* Short Description */}
        {description && (
          <p
            style={{
              marginTop: '0.35rem',
              fontSize: '0.875rem',
              color: 'var(--muted-foreground)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.5,
              marginRight: 0,
            }}
          >
            {description}
          </p>
        )}
      </Link>

      {/* Add to Bag button */}
      <button
        onClick={handleQuickAdd}
        disabled={!isAvailable}
        className="link-quiet"
        style={{
          marginTop: '0.75rem',
          fontSize: '0.875rem',
          color: added ? 'var(--primary)' : 'var(--foreground)',
          background: 'none',
          border: 'none',
          padding: '0.2rem 0',
          alignSelf: 'flex-start',
          cursor: isAvailable ? 'pointer' : 'default',
          letterSpacing: '0.02em',
        }}
      >
        {!isAvailable ? 'sold out' : added ? '✓ added to bag' : '+ add to bag'}
      </button>
    </article>
  );
}
