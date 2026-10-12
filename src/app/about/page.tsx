import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'our story | dear little things',
  description: 'a tiny studio for tiny joys — handmade stickers, charms, and slow-crafted objects.',
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '4rem 1.5rem 8rem 1.5rem' }}>
      {/* Editorial Header */}
      <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <p
          className="font-accent"
          style={{
            fontSize: '1.75rem',
            color: 'var(--primary)',
            margin: '0 0 0.5rem 0',
          }}
        >
          a little note from us
        </p>

        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(2.75rem, 5.5vw, 4.25rem)',
            lineHeight: 1.05,
            margin: '0 0 1.5rem 0',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--foreground)',
          }}
        >
          a tiny studio for tiny joys.
        </h1>

        <p
          style={{
            fontSize: '1.125rem',
            lineHeight: '1.7',
            color: 'var(--muted-foreground)',
            maxWidth: '38rem',
            margin: '0 auto',
            fontFamily: 'var(--font-sans)',
          }}
        >
          We believe the objects you carry, clip to your bag, or tuck into a journal should carry warmth and personal intention.
        </p>
      </div>

      {/* Hero Visual Frame */}
      <div
        className="paper-frame"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          marginBottom: '5rem',
          backgroundColor: 'var(--muted)',
        }}
      >
        <img
          src="/assets/hero.jpg"
          alt="Studio workbench with crochet strawberry keyring and stickers"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Editorial Story Layout */}
      <div
        style={{
          maxWidth: '44rem',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
          fontSize: '1.05rem',
          lineHeight: '1.85',
          color: 'var(--foreground)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div>
          <h2
            className="font-display"
            style={{
              fontSize: '2rem',
              fontWeight: 400,
              fontStyle: 'italic',
              margin: '0 0 1rem 0',
            }}
          >
            how it began
          </h2>
          <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>
            dear little things began as a quiet sketchbook practice on a sunlit corner desk. What started as late-night illustrations of everyday quiet moments soon evolved into tactile matte stickers, cut and inspected by hand, and tiny crochet companions made one loop at a time.
          </p>
        </div>

        <div>
          <h2
            className="font-display"
            style={{
              fontSize: '2rem',
              fontWeight: 400,
              fontStyle: 'italic',
              margin: '0 0 1rem 0',
            }}
          >
            our materials &amp; slow making
          </h2>
          <p style={{ color: 'var(--muted-foreground)', margin: '0 0 1.25rem 0' }}>
            We choose materials that feel good to hold and age gracefully with honest use:
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              color: 'var(--muted-foreground)',
            }}
          >
            <li style={{ paddingLeft: '1.5rem', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: 'var(--primary)' }}>&bull;</span>
              <strong style={{ color: 'var(--foreground)' }}>weatherproof matte vinyl:</strong> silky non-glare finish with durable laminate that resists water, sun, and daily handling on water bottles and laptops.
            </li>
            <li style={{ paddingLeft: '1.5rem', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: 'var(--primary)' }}>&bull;</span>
              <strong style={{ color: 'var(--foreground)' }}>solid brushed brass:</strong> heavy, tactile key charms that develop their own rich patina over months in your pocket.
            </li>
            <li style={{ paddingLeft: '1.5rem', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: 'var(--primary)' }}>&bull;</span>
              <strong style={{ color: 'var(--foreground)' }}>natural cotton threads:</strong> slow-crocheted goods stitched one by one without synthetic shortcuts.
            </li>
            <li style={{ paddingLeft: '1.5rem', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: 'var(--primary)' }}>&bull;</span>
              <strong style={{ color: 'var(--foreground)' }}>plastic-free packaging:</strong> wrapped in glassine bags and sturdy recyclable cardboard mailers.
            </li>
          </ul>
        </div>

        {/* Maker Note Callout */}
        <div
          style={{
            padding: '2.5rem',
            backgroundColor: 'rgba(244, 239, 235, 0.6)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            textAlign: 'center',
            marginTop: '1.5rem',
          }}
        >
          <p
            className="font-accent"
            style={{
              fontSize: '1.75rem',
              color: 'var(--primary)',
              margin: '0 0 0.5rem 0',
            }}
          >
            from my hands to yours
          </p>
          <p
            className="font-display"
            style={{
              fontSize: '1.5rem',
              fontStyle: 'italic',
              lineHeight: '1.4',
              color: 'var(--foreground)',
              margin: '0 0 1.5rem 0',
            }}
          >
            &ldquo;Thank you for supporting small studio craft and choosing to bring a little extra tenderness into the world.&rdquo;
          </p>
          <div>
            <Link href="/shop" className="btn-ink">
              browse the collection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
