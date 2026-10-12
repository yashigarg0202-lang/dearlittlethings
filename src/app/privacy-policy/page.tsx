import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Mio Studio',
  description: 'How customer data, order details, and privacy are protected at Mio Studio.',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--text-primary)' }}>Privacy Policy</span>
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
            honest data practices
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              lineHeight: 1.15,
              fontWeight: 400,
            }}
          >
            Privacy Policy
          </h1>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Last updated: October 10, 2026 • [Template Notice: Replace placeholder fields with studio registration specifics]
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--text-secondary)', lineHeight: '1.75', fontSize: '0.92rem' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-hairline)',
              fontSize: '0.85rem',
            }}
          >
            <strong>Maker Transparency Note:</strong> Mio Studio operates with a minimal-data philosophy. We do not sell user data, run intrusive behavioral ad trackers, or store unnecessary personal profiles.
          </div>

          <section>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              1. Information We Collect
            </h2>
            <p>
              When you interact with our store or place an order via WhatsApp or checkout, we collect only the minimal details necessary to craft, fulfill, and ship your goods:
            </p>
            <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>• <strong>Delivery Information:</strong> Full name, physical shipping address, phone number (for carrier and WhatsApp delivery updates), and email address.</li>
              <li>• <strong>Order History:</strong> Product items, variants selected, order date, and fulfillment status.</li>
              <li>• <strong>Studio Communications:</strong> Notes and inquiries sent through our contact forms or direct WhatsApp conversations.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              2. How We Use Your Information
            </h2>
            <p>
              Your information is used exclusively to:
            </p>
            <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>• Package and deliver your handmade orders with shipping carriers (e.g., USPS, Canada Post).</li>
              <li>• Provide direct order confirmation and tracking status updates via WhatsApp or email.</li>
              <li>• Send occasional studio dispatch letters if you have explicitly double-opted into our newsletter.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              3. Data Retention &amp; Customer Rights
            </h2>
            <p>
              You have the right to inspect, export, or request permanent deletion of your stored customer records at any time. Simply contact studio@miostudio.craft or message us directly on WhatsApp and your records will be cleared within 48 hours.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
