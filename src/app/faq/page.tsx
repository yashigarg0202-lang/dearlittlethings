import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Mio Studio',
  description: 'Common questions about custom orders, handmade turnaround times, WhatsApp ordering, and shipping.',
};

const FAQ_ITEMS = [
  {
    q: 'How does the WhatsApp order process work?',
    a: 'When you build your cart and proceed to checkout, our server automatically calculates live shipping rates, verifies real database stock, and applies any promotional coupons. Clicking "Confirm Total & Share on WhatsApp" instantly opens a pre-composed message to our studio phone with your exact order number and itemized breakdown for instant confirmation.',
  },
  {
    q: 'Can I request a custom crochet size or specific yarn colour?',
    a: 'Yes! We love custom requests. Since every crochet item is crafted on demand, you can reach out via WhatsApp or our Contact form with your desired dimensions or palette ideas. We will confirm yarn availability and timing.',
  },
  {
    q: 'Are your stickers fully waterproof?',
    a: 'Yes. Our die-cut stickers are printed on heavyweight vinyl with a soft-touch matte protective laminate. They withstand rain, sunlight, dishwasher cycles, and rough pocket wear on thermoses and phone cases.',
  },
  {
    q: 'How long does a made-to-order crochet item take to make?',
    a: 'Crochet pieces typically take 3–5 business days to craft, block, and steam before dispatch. If your order contains both stickers and made-to-order crochet goods, the entire order will ship together once the handmade piece is finished.',
  },
  {
    q: 'Do you offer gift wrapping or handwritten notes?',
    a: 'Every parcel is packed with unbleached tissue, glassine sleeves, and a small handwritten thank-you tag. If you are sending a gift directly to a friend, leave a note during checkout or in your WhatsApp confirmation and we will write your personalized message on letterpress paper.',
  },
  {
    q: 'How do I care for untreated brass charms?',
    a: 'Untreated brass develops a warm antique patina with age and skin contact. If you prefer high golden shine, rub lightly with a standard polishing cloth or a natural paste of baking soda and lemon juice.',
  },
];

export default function FAQPage() {
  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--text-primary)' }}>FAQ</span>
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
            clear answers from the workbench
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              lineHeight: 1.15,
              fontWeight: 400,
            }}
          >
            Frequently Asked Questions
          </h1>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-hairline)',
                padding: '1.75rem',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.25rem',
                  fontWeight: 400,
                  marginBottom: '0.75rem',
                  color: 'var(--text-primary)',
                }}
              >
                {item.q}
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.92rem' }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>

        {/* Still have a question? */}
        <div
          style={{
            marginTop: '3.5rem',
            padding: '2rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-hairline)',
            textAlign: 'center',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
            Have a question not listed here?
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            We are always happy to chat about custom projects, materials, or special dispatch requests.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/contact" className="btn-primary" style={{ fontSize: '0.88rem' }}>
              Send a Studio Message
            </Link>
            <a
              href="https://wa.me/15035550198?text=Hello%20Mio%20Studio%2C%20I%20have%20a%20question"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ fontSize: '0.88rem' }}
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
