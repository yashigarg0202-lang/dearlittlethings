'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CloseIcon } from '@/icons';

interface ShopFilterDrawerProps {
  categories: { id: string; name: string; slug: string }[];
  collections: { id: string; name: string; slug: string }[];
  currentCategory?: string;
  currentCollection?: string;
  currentSort?: string;
}

export default function ShopFilterDrawer({
  categories,
  collections,
  currentCategory,
  currentCollection,
  currentSort = 'newest',
}: ShopFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginBottom: '1.5rem' }} className="mobile-filter-bar">
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary"
        style={{
          width: '100%',
          padding: '0.65rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem',
        }}
      >
        <span>Filters & Sorting</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {currentCategory ? `Category: ${currentCategory}` : 'All Categories'}
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter Catalogue"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1050,
            display: 'flex',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(43, 35, 29, 0.4)',
            }}
          />

          {/* Drawer bottom/side */}
          <div
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '380px',
              height: '100%',
              backgroundColor: 'var(--bg-primary)',
              borderRight: '1px solid var(--border-hairline)',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
              zIndex: 1051,
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem' }}>Refine Catalogue</span>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close filters"
                style={{
                  padding: '0.4rem',
                  border: '1px solid var(--border-hairline)',
                  background: 'none',
                }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Categories */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.75rem' }}>Categories</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link
                  href="/shop"
                  onClick={() => setIsOpen(false)}
                  style={{
                    fontSize: '0.95rem',
                    color: !currentCategory ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: !currentCategory ? 600 : 400,
                  }}
                >
                  All Categories
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/shop?category=${c.slug}`}
                    onClick={() => setIsOpen(false)}
                    style={{
                      fontSize: '0.95rem',
                      color: currentCategory === c.slug ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                      fontWeight: currentCategory === c.slug ? 600 : 400,
                    }}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Collections */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.75rem' }}>Collections</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link
                  href="/shop"
                  onClick={() => setIsOpen(false)}
                  style={{
                    fontSize: '0.95rem',
                    color: !currentCollection ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: !currentCollection ? 600 : 400,
                  }}
                >
                  All Series
                </Link>
                {collections.map((col) => (
                  <Link
                    key={col.id}
                    href={`/shop?collection=${col.slug}`}
                    onClick={() => setIsOpen(false)}
                    style={{
                      fontSize: '0.95rem',
                      color: currentCollection === col.slug ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                      fontWeight: currentCollection === col.slug ? 600 : 400,
                    }}
                  >
                    {col.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.75rem' }}>Sort By</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Newest Arrivals', val: 'newest' },
                  { label: 'Price: Low to High', val: 'price-asc' },
                  { label: 'Price: High to Low', val: 'price-desc' },
                  { label: 'Alphabetical', val: 'title-asc' },
                ].map((s) => (
                  <Link
                    key={s.val}
                    href={`/shop?sort=${s.val}${currentCategory ? `&category=${currentCategory}` : ''}`}
                    onClick={() => setIsOpen(false)}
                    style={{
                      fontSize: '0.95rem',
                      color: currentSort === s.val ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                      fontWeight: currentSort === s.val ? 600 : 400,
                    }}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>

            <button onClick={() => setIsOpen(false)} className="btn-primary" style={{ marginTop: 'auto' }}>
              View Results
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 841px) {
          .mobile-filter-bar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
