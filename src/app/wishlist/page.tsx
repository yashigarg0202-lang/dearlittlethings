'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { useWishlist } from '@/context/WishlistContext';

export default function WishlistPage() {
  const { wishlistIds } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlistItems() {
      try {
        const res = await fetch('/api/wishlist');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.items || []);
        }
      } catch (err) {
        console.error('Failed to load wishlist items', err);
      } finally {
        setLoading(false);
      }
    }
    loadWishlistItems();
  }, [wishlistIds]);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '6rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-accent)',
            fontSize: '1.2rem',
            color: 'var(--accent-terracotta)',
            display: 'block',
          }}
        >
          Saved Keepsakes
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', margin: 0 }}>
          Your Wishlist
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Objects you have set aside for future studio orders.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Checking saved items...</div>
      ) : products.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-hairline)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
            No objects saved yet
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Browse the studio catalogue and click the heart icon on any piece to save it here.
          </p>
          <Link href="/shop" className="btn-primary">
            Explore All Goods
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '2.5rem 2rem',
          }}
        >
          {products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              title={p.title}
              slug={p.slug}
              images={p.images}
              variants={p.variants}
            />
          ))}
        </div>
      )}
    </div>
  );
}
