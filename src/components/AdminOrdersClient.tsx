'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface AdminOrdersClientProps {
  initialOrders: any[];
}

export default function AdminOrdersClient({ initialOrders }: AdminOrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [carrier, setCarrier] = useState('USPS');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const openOrderModal = (order: any) => {
    setSelectedOrder(order);
    setStatus(order.status);
    setCarrier(order.trackingCarrier || 'USPS');
    setTrackingNumber(order.trackingNumber || '');
    setNotice('');
  };

  const handleUpdate = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    setNotice('');

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingCarrier: carrier,
          trackingNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      setNotice('Order updated successfully!');
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status, trackingCarrier: carrier, trackingNumber } : o))
      );
      setSelectedOrder((prev: any) => ({ ...prev, status, trackingCarrier: carrier, trackingNumber }));
    } catch (err: any) {
      setNotice(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-secondary)' }}>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Order #</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Customer</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Items</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Total</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'right' }}>Manage</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <td style={{ padding: '0.85rem 1rem' }}>
                  <strong>#{o.orderNumber}</strong>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div>{o.guestName || 'Customer'}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.guestEmail}</div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  {o.items.length} {o.items.length === 1 ? 'item' : 'items'}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span
                    style={{
                      padding: '0.15rem 0.45rem',
                      backgroundColor: o.status === 'PAID' ? 'var(--accent-sage-light)' : 'var(--bg-tag)',
                      color: o.status === 'PAID' ? 'var(--accent-sage)' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {o.status}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                  ${(o.totalAmount / 100).toFixed(2)}
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                  <button
                    onClick={() => openOrderModal(o)}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    Manage &rarr;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Management Dialog */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={() => setSelectedOrder(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(43, 35, 29, 0.4)',
            }}
          />

          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-hairline)',
              padding: '2rem',
              zIndex: 1051,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600 }}>
                  Order #{selectedOrder.orderNumber}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>

            {notice && (
              <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-tag)', border: '1px solid var(--border-hairline)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {notice}
              </div>
            )}

            {/* Customer Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div><strong>Customer:</strong> {selectedOrder.guestName} ({selectedOrder.guestEmail})</div>
              <div>
                <strong>Shipping Address:</strong> {(() => {
                  try {
                    const a = JSON.parse(selectedOrder.shippingAddress);
                    return `${a.fullName}, ${a.addressLine1} ${a.addressLine2 || ''}, ${a.city}, ${a.state || ''} ${a.postalCode}, ${a.country} (Phone: ${a.phone || 'N/A'})`;
                  } catch {
                    return selectedOrder.shippingAddress;
                  }
                })()}
              </div>
              {selectedOrder.customerNotes && (
                <div><strong>Customer Note:</strong> &ldquo;{selectedOrder.customerNotes}&rdquo;</div>
              )}
            </div>

            {/* Items */}
            <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                Itemized Snapshots:
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                {selectedOrder.items.map((i: any) => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{i.quantity} &times; {i.productTitleSnapshot} ({i.variantNameSnapshot})</span>
                    <span>${((i.priceSnapshot * i.quantity) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: 600 }}>
                <span>Grand Total</span>
                <span>${(selectedOrder.totalAmount / 100).toFixed(2)} USD</span>
              </div>
            </div>

            {/* Status Update Form */}
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.75rem' }}>Fulfillment & Status</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                    Tracking Carrier
                  </label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="USPS / FedEx / DHL"
                    style={{ width: '100%', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 9400 1000 0000 0000 0000 00"
                  style={{ width: '100%', padding: '0.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={loading}
                className="btn-primary"
                style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                {loading ? 'Saving...' : 'Update Fulfillment Status'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link
                href={`/order-confirmation/${selectedOrder.orderNumber}`}
                target="_blank"
                style={{ fontSize: '0.85rem', textDecoration: 'underline', color: 'var(--text-secondary)' }}
              >
                Printable Packing Slip &rarr;
              </Link>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
