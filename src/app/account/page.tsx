'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface AccountOrderItem {
  id: string;
  quantity: number;
  productTitleSnapshot: string;
  variantNameSnapshot?: string | null;
  priceSnapshot: number;
}

export interface AccountOrder {
  id: string;
  orderNumber: string;
  createdAt: string | Date;
  status: string;
  totalAmount: number;
  shippingMethodName?: string | null;
  trackingNumber?: string | null;
  items: AccountOrderItem[];
}

export interface AccountAddress {
  id: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  phone?: string | null;
}

export interface AccountProfileData {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  orders: AccountOrder[];
  addresses: AccountAddress[];
}

export default function AccountDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AccountProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'privacy'>('orders');

  useEffect(() => {
    async function loadAccount() {
      try {
        const res = await fetch('/api/account/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadAccount();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
        Loading account details...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container" style={{ paddingTop: '3.5rem', paddingBottom: '6rem' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid var(--border-hairline)',
          paddingBottom: '2rem',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: 'var(--font-accent)',
              fontSize: '1.2rem',
              color: 'var(--accent-terracotta)',
              display: 'block',
            }}
          >
            Studio Collector
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', margin: '0.2rem 0' }}>
            Hello, {user.name || user.email}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Signed in as {user.email} {user.role === 'ADMIN' && <span className="badge-admin" style={{ marginLeft: '0.5rem' }}>Studio Staff</span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {user.role === 'ADMIN' && (
            <Link href="/admin" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border-hairline)', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'orders' ? '2px solid var(--text-primary)' : '2px solid transparent',
            paddingBottom: '0.6rem',
            fontSize: '1rem',
            fontWeight: activeTab === 'orders' ? 600 : 400,
            color: activeTab === 'orders' ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          Order History ({user.orders?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'addresses' ? '2px solid var(--text-primary)' : '2px solid transparent',
            paddingBottom: '0.6rem',
            fontSize: '1rem',
            fontWeight: activeTab === 'addresses' ? 600 : 400,
            color: activeTab === 'addresses' ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          Saved Addresses ({user.addresses?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'privacy' ? '2px solid var(--text-primary)' : '2px solid transparent',
            paddingBottom: '0.6rem',
            fontSize: '1rem',
            fontWeight: activeTab === 'privacy' ? 600 : 400,
            color: activeTab === 'privacy' ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          Data & Privacy
        </button>
      </div>

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div>
          {(!user.orders || user.orders.length === 0) ? (
            <div
              style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-surface)',
                border: '1px dashed var(--border-hairline)',
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
                No past orders recorded yet
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                When you order handmade pieces, your dispatch summaries and tracking details will appear here.
              </p>
              <Link href="/shop" className="btn-primary">
                Browse Studio Goods
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {user.orders.map((order: AccountOrder) => (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-hairline)',
                    padding: '1.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      borderBottom: '1px solid var(--border-hairline)',
                      paddingBottom: '1rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600 }}>
                        Order #{order.orderNumber}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          backgroundColor: 'var(--bg-tag)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {order.status}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                        ${(order.totalAmount / 100).toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {order.items.map((item: AccountOrderItem) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>
                          {item.quantity} × {item.productTitleSnapshot} ({item.variantNameSnapshot})
                        </span>
                        <span>${((item.priceSnapshot * item.quantity) / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tracking link & actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-hairline)', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Shipping: {order.shippingMethodName || 'Studio Standard Delivery'}
                      {order.trackingNumber && ` • Tracking: ${order.trackingNumber}`}
                    </span>
                    <Link
                      href={`/order-confirmation/${order.orderNumber}`}
                      style={{ textDecoration: 'underline', color: 'var(--text-primary)' }}
                    >
                      View Full Receipt & WhatsApp Summary
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Addresses */}
      {activeTab === 'addresses' && (
        <div>
          {(!user.addresses || user.addresses.length === 0) ? (
            <div
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-surface)',
                border: '1px dashed var(--border-hairline)',
              }}
            >
              <p style={{ color: 'var(--text-secondary)' }}>
                No addresses saved yet. Addresses are saved during checkout for easy repeat orders.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {user.addresses.map((addr: AccountAddress) => (
                <div
                  key={addr.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-hairline)',
                    padding: '1.5rem',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: '0.5rem' }}>{addr.fullName}</strong>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                    {addr.addressLine1} {addr.addressLine2 || ''}<br />
                    {addr.city}, {addr.state || ''} {addr.postalCode}<br />
                    {addr.country}<br />
                    {addr.phone && `Phone: ${addr.phone}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Privacy & Data Export */}
      {activeTab === 'privacy' && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            padding: '2rem',
            maxWidth: '600px',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.75rem' }}>
            Data Export & Account Management
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            In accordance with our studio privacy policy, you may export your purchase history or request permanent deletion of your account credentials.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              onClick={() => {
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(user, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute('href', dataStr);
                downloadAnchor.setAttribute('download', `mio-studio-data-${user.id}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="btn-secondary"
              style={{ width: 'fit-content' }}
            >
              Export Account Data (JSON)
            </button>

            <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                To delete your account or request data redaction, contact: <strong>hello@miostudio.craft</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
