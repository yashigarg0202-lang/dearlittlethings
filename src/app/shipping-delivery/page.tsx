import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Delivery | Mio Studio',
  description: 'Dispatch timelines, packaging practices, and tracking information for Mio Studio handmade orders.',
};

export default function ShippingDeliveryPage() {
  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--text-primary)' }}>Shipping &amp; Delivery</span>
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
            careful dispatch from our workbench
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              lineHeight: 1.15,
              fontWeight: 400,
            }}
          >
            Shipping &amp; Delivery Information
          </h1>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Dispatch Timelines */}
          <section>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.4rem',
                fontWeight: 400,
                marginBottom: '1rem',
                color: 'var(--text-primary)',
              }}
            >
              1. Production &amp; Dispatch Schedule
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem', marginBottom: '1rem' }}>
              Because our catalogue includes both ready-to-ship paper goods and slow made-to-order crochet pieces, dispatch times vary by item:
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-hairline)',
                  padding: '1.25rem',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '0.35rem' }}>
                  Stickers &amp; Keyrings
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-terracotta)', marginBottom: '0.5rem' }}>
                  Ready to ship in 1–2 business days
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  In-stock stationery, die-cut matte stickers, and brass keyrings are packaged and dispatched within 48 hours.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-hairline)',
                  padding: '1.25rem',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '0.35rem' }}>
                  Handmade Crochet Goods
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-terracotta)', marginBottom: '0.5rem' }}>
                  Handmade to order: 3–5 business days
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Each pouch, tote, and coaster is crocheted by hand specifically for your order, blocked with steam, and inspected.
                </p>
              </div>
            </div>
          </section>

          {/* Shipping Rates */}
          <section>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.4rem',
                fontWeight: 400,
                marginBottom: '1rem',
                color: 'var(--text-primary)',
              }}
            >
              2. Shipping Rates &amp; Delivery Estimates
            </h2>
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-hairline)',
                padding: '1.5rem',
              }}
            >
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: 0 }}>
                <li style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500, fontSize: '0.95rem' }}>
                    <span>Standard Studio Tracked Mail (USPS Ground)</span>
                    <span>$4.50 (Free over $45)</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Estimated delivery: 3–5 business days after dispatch. Full tracking link provided via WhatsApp / Email.
                  </div>
                </li>
                <li>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500, fontSize: '0.95rem' }}>
                    <span>Studio Priority Tracked Dispatch</span>
                    <span>$9.00</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Estimated delivery: 1–3 business days after dispatch via Priority Mail.
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Packaging Note */}
          <section>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.4rem',
                fontWeight: 400,
                marginBottom: '0.75rem',
                color: 'var(--text-primary)',
              }}
            >
              3. Thoughtful, Plastic-Free Packaging
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
              Every parcel leaves our studio wrapped in translucent glassine paper, sealed with kraft paper tape, and stamped with our studio mark. We use recyclable rigid mailers and unbleached cotton ribbon to ensure your items arrive in pristine condition without contributing single-use plastics to landfills.
            </p>
          </section>

          {/* Order Tracking */}
          <section
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.2rem',
                fontWeight: 400,
                marginBottom: '0.5rem',
              }}
            >
              Need to check on an order?
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
              Message us directly on WhatsApp with your Order ID (e.g. MIO-8392-ABCD) or email studio@miostudio.craft for an instant tracking update.
            </p>
            <Link href="/contact" className="btn-primary" style={{ display: 'inline-block', fontSize: '0.85rem' }}>
              Contact Studio Desk →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
