'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const pathname = usePathname();
  const { openCart, cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Announcement Bar */}
      <div
        style={{
          backgroundColor: 'var(--foreground)',
          color: 'var(--background)',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          padding: '0.4rem 1rem',
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
        }}
      >
        <span>small things that make everything a little more beautiful ✿ free delivery on orders over ₹499</span>
      </div>

      {/* Main Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'rgba(250, 247, 242, 0.92)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
          }}
        >
          {/* Brand Wordmark */}
          <Link
            href="/"
            className="font-display"
            style={{
              fontSize: '1.6rem',
              fontStyle: 'italic',
              letterSpacing: '-0.025em',
              color: 'var(--foreground)',
              textDecoration: 'none',
            }}
          >
            dear little things
          </Link>

          {/* Desktop Navigation */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              fontSize: '0.875rem',
              letterSpacing: '0.025em',
            }}
          >
            <Link
              href="/shop"
              className="link-quiet"
              style={{
                color: pathname === '/shop' ? 'var(--foreground)' : 'var(--foreground)',
                fontWeight: pathname === '/shop' ? 600 : 400,
              }}
            >
              shop
            </Link>

            <Link
              href="/about"
              className="link-quiet"
              style={{
                display: 'inline-block',
                color: pathname === '/about' ? 'var(--foreground)' : 'var(--foreground)',
                fontWeight: pathname === '/about' ? 600 : 400,
              }}
            >
              our story
            </Link>

            {/* Bag Button matching reference */}
            <button
              onClick={openCart}
              type="button"
              className="link-quiet"
              aria-label={`Shopping bag containing ${cartCount} items`}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.875rem',
                letterSpacing: '0.025em',
                color: 'var(--foreground)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: 0,
              }}
            >
              bag <span className="font-accent" style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>({cartCount})</span>
            </button>

            {/* Mobile menu hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Toggle navigation menu"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: 'var(--foreground)',
              }}
              className="mobile-toggle"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </nav>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              fontSize: '1rem',
            }}
          >
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="link-quiet"
              style={{ padding: '0.25rem 0' }}
            >
              shop the collection
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="link-quiet"
              style={{ padding: '0.25rem 0' }}
            >
              our story
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openCart();
              }}
              style={{
                textAlign: 'left',
                background: 'none',
                border: 'none',
                padding: '0.25rem 0',
                cursor: 'pointer',
                color: 'var(--foreground)',
                fontSize: '1rem',
              }}
            >
              view bag <span className="font-accent" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>({cartCount})</span>
            </button>
          </div>
        )}
      </header>
    </>
  );
}
