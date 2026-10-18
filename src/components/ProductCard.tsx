'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/lib/currency';
import { stripHtmlToPlainText } from '@/lib/sanitize-description';

export interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  images: { url: string; altText: string; isPrimary?: boolean }[];
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
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const plainDescription = description ? stripHtmlToPlainText(description) : '';

  const primaryImage = images.find((img) => img.isPrimary) || images[0] || {
    url: '/placeholders/product-stickers-1.svg',
    altText: title,
  };

  const defaultVariant = variants[0];
  const price = defaultVariant ? defaultVariant.price : 0;
  const isAvailable = variants.some((v: ProductCardProps['variants'][number]) => v.stock > 0);

  // Explicit Add to Bag handler: strictly stops propagation so navigation is never triggered
  const handleQuickAdd = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant || !isAvailable || isAdding) return;

    setIsAdding(true);
    try {
      const res = await addToCart(defaultVariant.id, 1);
      if (res.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
    } catch (err) {
      console.error('Failed to add to bag:', err);
    } finally {
      setIsAdding(false);
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
      {/* Product Detail Navigation Link: clicking image, title, price, or description strictly navigates to details */}
      <Link
        href={`/product/${slug}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        {/* Paper Frame Image Container with zero Cumulative Layout Shift */}
        <div
          className="paper-frame"
          style={{
            position: 'relative',
            aspectRatio: '4 / 5',
            overflow: 'hidden',
            backgroundColor: 'var(--card)',
          }}
        >
          <Image
            src={primaryImage.url}
            alt={primaryImage.altText || title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={index === 0}
            style={{
              objectFit: 'cover',
              transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
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
        {plainDescription && (
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
            {plainDescription}
          </p>
        )}
      </Link>

      {/* Explicit Add to Bag button: isolated from card navigation with explicit type="button" */}
      <button
        type="button"
        onClick={handleQuickAdd}
        disabled={!isAvailable || isAdding}
        className="link-quiet"
        aria-label={!isAvailable ? `${title} is sold out` : `Add ${title} to bag`}
        style={{
          marginTop: '0.75rem',
          fontSize: '0.875rem',
          color: added ? 'var(--primary)' : 'var(--foreground)',
          background: 'none',
          border: 'none',
          padding: '0.2rem 0',
          alignSelf: 'flex-start',
          cursor: isAvailable && !isAdding ? 'pointer' : 'default',
          letterSpacing: '0.02em',
          opacity: isAdding ? 0.7 : 1,
        }}
      >
        {!isAvailable ? 'sold out' : added ? '✓ added to bag' : isAdding ? 'adding...' : '+ add to bag'}
      </button>
    </article>
  );
}
