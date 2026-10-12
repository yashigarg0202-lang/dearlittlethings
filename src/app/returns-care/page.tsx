import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Product Care | Mio Studio',
  description: 'Care instructions for handmade crochet, brass charms, and vinyl stickers, plus return guidelines.',
};

export default function ReturnsCarePage() {
  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--text-primary)' }}>Returns &amp; Care</span>
        </div>

        <header style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '2rem', marginBottom: '2.5rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-accent)',
              color: 'var(--accent-terracotta)',
              fontSize: '1.25rem',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            keeping your pieces lovely for years
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              lineHeight: 1.15,
              fontWeight: 400,
            }}
          >
            Product Care &amp; Studio Returns
          </h1>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Section 1: Detailed Care Guides */}
          <section>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                fontWeight: 400,
                marginBottom: '1.25rem',
                color: 'var(--text-primary)',
              }}
            >
              Handmade Product Care
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Crochet Care */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-hairline)',
                  padding: '1.5rem',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  Handmade Crochet Goods (Cotton &amp; Linen)
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <li>• <strong>Washing:</strong> Spot clean or hand wash gently in lukewarm water using mild pH-neutral wool/linen wash.</li>
                  <li>• <strong>Drying:</strong> Never wring or twist. Gently roll inside a dry towel to absorb moisture, then lay flat to dry in the shade.</li>
                  <li>• <strong>Reshaping:</strong> If needed, reshape edges with light steam from a household iron held 2 inches away from yarn.</li>
                </ul>
              </div>

              {/* Brass Care */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-hairline)',
                  padding: '1.5rem',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  Solid Brass Keyrings &amp; Charms
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <li>• <strong>Natural Patina:</strong> Our brass is untreated so it will develop an organic golden patina over time.</li>
                  <li>• <strong>Restoring Bright Luster:</strong> If you prefer high shine, rub lightly with a jewelry polishing cloth or a dab of lemon juice and baking soda, then dry immediately.</li>
                </ul>
              </div>

              {/* Sticker Care */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-hairline)',
                  padding: '1.5rem',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  Matte Vinyl Stickers
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <li>• <strong>Application:</strong> Apply to a clean, smooth, dry surface. Press firmly from center to edges.</li>
                  <li>• <strong>Durability:</strong> Water-resistant and dishwasher safe (top rack), though hand-washing gently with non-abrasive sponge will extend longevity for years.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2: Returns & Exchanges */}
          <section>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                fontWeight: 400,
                marginBottom: '1rem',
                color: 'var(--text-primary)',
              }}
            >
              Returns &amp; Exchange Policy
            </h2>
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-hairline)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                fontSize: '0.92rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
              }}
            >
              <p>
                <strong>14-Day Studio Return Window:</strong> We want you to love your handmade pieces. If an item does not meet your expectations, you may return unwashed, unused goods in original packaging within 14 days of delivery.
              </p>
              <p>
                <strong>Handmade Variation:</strong> Because each crochet piece and brass charm is hand-finished, slight natural variations in stitch tension or brass grain are characteristic of authentic craftsmanship rather than defects.
              </p>
              <p>
                <strong>Damaged or Missing Items:</strong> If a parcel arrives damaged in transit, please send a quick photo to studio@miostudio.craft or directly on WhatsApp within 48 hours and we will immediately prepare a replacement piece.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
