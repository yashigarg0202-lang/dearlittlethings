import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminLogoutButton from '@/components/AdminLogoutButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Studio Admin Portal | Mio Studio',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?admin=1');
  }

  if (user.role !== 'ADMIN') {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '8px',
            maxWidth: '480px',
            width: '100%',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(58, 43, 36, 0.05)',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              color: 'var(--accent-terracotta)',
              margin: '0 0 0.5rem 0',
            }}
          >
            403 &bull; Access Denied
          </h1>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: '0 0 1.5rem 0',
            }}
          >
            You are signed in as <strong>{user.email}</strong>, but this account does not have administrator privileges to access the studio admin portal.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link
              href="/account"
              className="btn-primary"
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.88rem',
                textDecoration: 'none',
              }}
            >
              Customer Account
            </Link>
            <Link
              href="/"
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.88rem',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                borderRadius: '4px',
              }}
            >
              Return to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navLinks = [
    { label: 'Overview', href: '/admin' },
    { label: 'Products', href: '/admin/products' },
    { label: 'Orders', href: '/admin/orders' },
    { label: 'Inventory', href: '/admin/inventory' },
    { label: 'Categories', href: '/admin/categories' },
    { label: 'Discounts', href: '/admin/discounts' },
    { label: 'Shipping', href: '/admin/shipping' },
    { label: 'Subscribers', href: '/admin/subscribers' },
    { label: 'Store Settings', href: '/admin/settings' },
    { label: 'Audit Log', href: '/admin/audit-logs' },
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', borderTop: '2px solid var(--text-primary)' }}>
      {/* Top Admin Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-hairline)',
          padding: '0.85rem 1.5rem',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'inherit',
                textDecoration: 'none',
              }}
              title="Return to customer storefront"
            >
              dear little things &bull; Studio Admin
            </Link>
            <span className="badge-admin">Admin Portal</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span>Logged in as <strong>{user.name || user.email}</strong></span>
              <AdminLogoutButton />
            </div>
            <Link href="/" target="_blank" style={{ textDecoration: 'underline', color: 'var(--text-secondary)' }}>
              View Live Storefront &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Nav Sub-header */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-hairline)',
          overflowX: 'auto',
        }}
      >
        <div className="container" style={{ display: 'flex', gap: '1.5rem', padding: '0.6rem 1.5rem' }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: '0.88rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                padding: '0.2rem 0',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Admin Content */}
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
        {children}
      </div>
    </div>
  );
}
