import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminLogoutButton from '@/components/AdminLogoutButton';

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

  if (!user || user.role !== 'ADMIN') {
    redirect('/login?admin=1');
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
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600 }}>
              dear little things &bull; Studio Admin
            </span>
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
