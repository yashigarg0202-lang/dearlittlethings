'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Studio application error:', error);
  }, [error]);

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
          unexpected pause
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
          Something paused on the workbench.
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.7',
            marginBottom: '2.5rem',
          }}
        >
          An unexpected issue prevented this page from rendering properly. Our logs have noted the occurrence.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => reset()}
            className="btn-primary"
          >
            Try Again
          </button>
          <Link href="/" className="btn-secondary">
            Return to Front Door
          </Link>
        </div>
      </div>
    </div>
  );
}
