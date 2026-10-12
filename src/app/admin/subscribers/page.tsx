import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminSubscribersPage() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <span
            style={{
              fontFamily: 'var(--font-accent)',
              color: 'var(--accent-terracotta)',
              fontSize: '1.1rem',
              display: 'block',
            }}
          >
            audience &amp; dispatch list
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.2rem',
              fontWeight: 400,
            }}
          >
            Newsletter Subscribers
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {subscribers.length} total patrons subscribed for studio release dispatches.
          </p>
        </div>

        <a
          href="/api/admin/subscribers?format=csv"
          className="btn-primary"
          style={{ fontSize: '0.88rem' }}
          download
        >
          Export Subscribers (.CSV)
        </a>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-hairline)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1.5fr',
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-hairline)',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <div>Subscriber Email</div>
          <div>Status</div>
          <div>Date Joined</div>
        </div>

        {subscribers.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No newsletter subscribers recorded yet.
          </div>
        ) : (
          <div>
            {subscribers.map((sub) => (
              <div
                key={sub.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1.5fr',
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--border-hairline)',
                  alignItems: 'center',
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  {sub.email}
                </div>
                <div>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.75rem',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: sub.status === 'CONFIRMED' ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      color: sub.status === 'CONFIRMED' ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {sub.status === 'CONFIRMED' ? 'Confirmed' : sub.status}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {new Date(sub.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
