'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatINR } from '@/lib/currency';

interface RecentlyViewedItem {
  id: string;
  title: string;
  slug: string;
  image?: string;
  price: number;
}

export default function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mio_recently_viewed');
      if (stored) {
        const parsed = JSON.parse(stored);
        const filtered = parsed.filter((item: RecentlyViewedItem) => item.id !== currentProductId);
        setItems(filtered);
      }
    } catch {
      // Ignore
    }
  }, [currentProductId]);

  if (items.length === 0) return null;

  return (
    <section
      style={{
        marginTop: '4rem',
        paddingTop: '3rem',
        borderTop: '1px solid var(--border-hairline)',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-accent)',
            fontSize: '1.1rem',
            color: 'var(--accent-terracotta)',
            display: 'block',
          }}
        >
          Browsing History
        </span>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0 }}>
          Recently Contemplated
        </h3>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/product/${item.slug}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              padding: '0.75rem',
              color: 'var(--text-primary)',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1 / 1',
                backgroundColor: 'var(--bg-primary)',
                marginBottom: '0.5rem',
                overflow: 'hidden',
              }}
            >
              {item.image ? (
                <Image src={item.image} alt={item.title} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Photo
                </div>
              )}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '0.95rem',
                lineHeight: '1.2',
                marginBottom: '0.25rem',
              }}
            >
              {item.title}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {formatINR(item.price)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
