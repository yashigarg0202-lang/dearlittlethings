import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Mio Studio',
  description: 'Terms and conditions governing orders and custom handmade commissions at Mio Studio.',
};

export default function TermsOfServicePage() {
  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--text-primary)' }}>Terms of Service</span>
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
            store policies and craft terms
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              lineHeight: 1.15,
              fontWeight: 400,
            }}
          >
            Terms of Service
          </h1>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Last updated: October 10, 2026 • [Template Notice: Store owner must review with a qualified legal professional]
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--text-secondary)', lineHeight: '1.75', fontSize: '0.92rem' }}>
          <section>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              1. Overview
            </h2>
            <p>
              Mio Studio is an independent artisanal brand offering handcrafted paper stationery, brass key accessories, and custom crochet pieces. By accessing our website, placing an order, or communicating via WhatsApp, you agree to the conditions outlined herein.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              2. Handmade Nature and Variation
            </h2>
            <p>
              Each item sold by Mio Studio is handmade in small batches. Because of this authentic process, minor variances in dye lots, yarn texture, stitch tension, and brass grain finish are expected and celebrated as part of the one-of-a-kind character of handmade objects.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              3. Pricing and Order Placement
            </h2>
            <p>
              All prices are listed in configured studio minor currency units and verified server-side. Orders placed through WhatsApp confirmation are reserved and entered into our studio queue upon mutual agreement between customer and maker.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              4. Intellectual Property
            </h2>
            <p>
              All illustrations, original crochet patterns, sticker designs, photography, and written text on this site are the intellectual property of Mio Studio and may not be reproduced or distributed without explicit written permission.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
