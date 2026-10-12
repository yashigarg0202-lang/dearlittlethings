import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        paddingTop: '6rem',
        paddingBottom: '8rem',
        textAlign: 'center',
      }}
    >
      <div className="container" style={{ maxWidth: '640px' }}>
        <span
          style={{
            fontFamily: 'var(--font-accent)',
            color: 'var(--accent-terracotta)',
            fontSize: '1.4rem',
            display: 'block',
            marginBottom: '0.5rem',
          }}
        >
          page not found
        </span>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
            fontWeight: 400,
            lineHeight: 1.1,
            marginBottom: '1rem',
          }}
        >
          A quiet empty corner.
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.7',
            marginBottom: '2.5rem',
          }}
        >
          The page or archival piece you were looking for seems to have moved to another shelf in our studio workshop.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/shop" className="btn-primary">
            Explore All Goods →
          </Link>
          <Link href="/" className="btn-secondary">
            Return to Front Door
          </Link>
        </div>

        <div
          style={{
            marginTop: '4rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--border-hairline)',
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
          }}
        >
          Popular studio destinations: <Link href="/category/stickers" style={{ textDecoration: 'underline' }}>Stickers</Link> • <Link href="/category/keyrings" style={{ textDecoration: 'underline' }}>Keyrings</Link> • <Link href="/category/crochet" style={{ textDecoration: 'underline' }}>Crochet</Link>
        </div>
      </div>
    </div>
  );
}
