import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: '8rem',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--background)',
      }}
    >
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '4rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          alignItems: 'start',
        }}
      >
        {/* Col 1: Brand & Tagline */}
        <div>
          <p
            className="font-display"
            style={{
              fontSize: '1.875rem',
              fontStyle: 'italic',
              margin: 0,
              color: 'var(--foreground)',
              lineHeight: 1.2,
            }}
          >
            dear little things
          </p>
          <p
            className="font-accent"
            style={{
              marginTop: '0.5rem',
              fontSize: '1.25rem',
              color: 'var(--primary)',
              margin: '0.5rem 0 0 0',
            }}
          >
            small things that make everything a little more beautiful
          </p>
        </div>

        {/* Col 2: Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
          <Link href="/shop" className="link-quiet" style={{ color: 'var(--foreground)' }}>
            shop all
          </Link>
          <Link href="/about" className="link-quiet" style={{ color: 'var(--foreground)' }}>
            our story
          </Link>
          <Link href="/contact" className="link-quiet" style={{ color: 'var(--foreground)' }}>
            contact &amp; studio notes
          </Link>
          <Link href="/shipping-delivery" className="link-quiet" style={{ color: 'var(--muted-foreground)' }}>
            shipping &amp; delivery
          </Link>
          <Link href="/privacy-policy" className="link-quiet" style={{ color: 'var(--muted-foreground)' }}>
            privacy &amp; terms
          </Link>
        </div>

        {/* Col 3: Handmade declaration & Copyright */}
        <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            made slowly, by hand.<br />
            packaged with paper, intention, and care.<br />
            © {new Date().getFullYear()} dear little things
          </p>
        </div>
      </div>
    </footer>
  );
}
