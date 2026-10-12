'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'General Inquiry',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setIsError(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setStatusMessage(data.message || 'Your inquiry has been sent to the maker. Thank you!');
        setFormData({ name: '', email: '', topic: 'General Inquiry', message: '' });
      } else {
        setIsError(true);
        setStatusMessage(data.error || 'Could not send message. Please try again or use WhatsApp.');
      }
    } catch {
      setIsError(true);
      setStatusMessage('Connection error. Please try again or reach out on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--text-primary)' }}>Contact</span>
        </div>

        <header style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '2rem', marginBottom: '3rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-accent)',
              color: 'var(--accent-terracotta)',
              fontSize: '1.25rem',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            direct maker communication
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
              lineHeight: 1.15,
              fontWeight: 400,
            }}
          >
            Get in Touch with Mio Studio
          </h1>
          <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', maxWidth: '650px', fontSize: '0.98rem' }}>
            Questions regarding small-batch releases, custom crochet dimensions, bulk sticker orders, or delivery inquiries are answered by the maker.
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Form */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              padding: '2rem',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.4rem',
                fontWeight: 400,
                marginBottom: '1.5rem',
              }}
            >
              Send a Studio Note
            </h2>

            {statusMessage && (
              <div
                style={{
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  backgroundColor: isError ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                  border: isError ? '1px solid var(--accent-terracotta)' : '1px solid var(--accent-sage)',
                  color: isError ? 'var(--accent-terracotta)' : 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              >
                {statusMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label
                  htmlFor="name"
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem' }}
                >
                  Your Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-hairline)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem' }}
                >
                  Your Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="e.g. maya@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-hairline)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="topic"
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem' }}
                >
                  Inquiry Topic
                </label>
                <select
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-hairline)',
                    fontSize: '0.9rem',
                  }}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Order & Delivery Status">Order &amp; Delivery Status</option>
                  <option value="Custom Crochet Sizing">Custom Crochet Sizing</option>
                  <option value="Bulk / Wholesale Stickers">Bulk / Wholesale Stickers</option>
                  <option value="Press & Collaborative Projects">Press &amp; Collaborative Projects</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem' }}
                >
                  Message Note *
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  placeholder="Write your note here..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-hairline)',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
              >
                {isSubmitting ? 'Delivering note...' : 'Send Note to Studio'}
              </button>
            </form>
          </div>

          {/* Right Column: Instant WhatsApp & Studio Hours */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* WhatsApp Box */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-hairline)',
                padding: '2rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-accent)',
                  color: 'var(--accent-terracotta)',
                  fontSize: '1.1rem',
                  display: 'block',
                  marginBottom: '0.35rem',
                }}
              >
                fastest reply
              </span>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.35rem',
                  fontWeight: 400,
                  marginBottom: '0.75rem',
                }}
              >
                Chat Directly on WhatsApp
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                For quick questions regarding ready-to-ship stock, custom color choices, or order adjustments, send a message directly to our studio phone.
              </p>

              <a
                href="https://wa.me/15035550198?text=Hello%20Mio%20Studio%2C%20I%20have%20a%20question%20about%20your%20handmade%20goods"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ display: 'inline-block', textAlign: 'center' }}
              >
                Open Studio WhatsApp Chat →
              </a>
            </div>

            {/* Studio Hours & Location */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-hairline)',
                padding: '1.75rem',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.2rem',
                  fontWeight: 400,
                  marginBottom: '1rem',
                }}
              >
                Studio Hours &amp; Location
              </h3>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div><strong>Workbench Schedule:</strong> Tuesday – Saturday (10am – 5pm PST)</div>
                <div><strong>Email:</strong> studio@miostudio.craft</div>
                <div><strong>Location:</strong> Artisan Alley, Studio 4B, Portland, OR 97204</div>
                <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Please note: The studio workshop is private and not currently open for retail walk-ins. All orders are dispatched via tracked mail.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
