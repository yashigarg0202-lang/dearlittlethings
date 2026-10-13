'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatINR } from '@/lib/currency';

interface MockGatewayOrderItem {
  id: string;
  quantity: number;
  productTitleSnapshot: string;
  variantNameSnapshot?: string | null;
  priceSnapshot: number;
}

interface MockGatewayOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  guestName?: string | null;
  guestEmail?: string | null;
  shippingMethodName?: string | null;
  items: MockGatewayOrderItem[];
}

interface MockGatewayProps {
  searchParams: Promise<{
    orderId?: string;
    session?: string;
  }>;
}

export default function MockGatewayPage({ searchParams }: MockGatewayProps) {
  const router = useRouter();
  const { orderId, session } = use(searchParams);
  const [order, setOrder] = useState<MockGatewayOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setError('Missing order identifier');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders/lookup?orderId=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          setError('Order details could not be found');
        }
      } catch {
        setError('Failed to connect to checkout session');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  const handleSimulatePayment = async () => {
    if (!order) return;
    setProcessing(true);
    setError('');

    try {
      // Send verified webhook to the server
      const webhookRes = await fetch('/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-signature': 'test_mode_valid_signature_2026',
        },
        body: JSON.stringify({
          orderId: order.id,
          paymentIntentId: session || `test_intent_${Date.now()}`,
        }),
      });

      if (!webhookRes.ok) {
        const errData = await webhookRes.json();
        throw new Error(errData.error || 'Webhook confirmation failed');
      }

      // Redirect to confirmation page
      router.push(`/order-confirmation/${order.orderNumber}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment processing failed';
      setError(message);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
        Connecting to test payment provider...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-terracotta)', fontSize: '1.2rem' }}>{error || 'Invalid session'}</p>
        <Link href="/cart" className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Return to Shopping Bag
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem', maxWidth: '640px' }}>
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          padding: '2.5rem',
        }}
      >
        <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-accent)',
              color: 'var(--accent-terracotta)',
              fontSize: '1.1rem',
              display: 'block',
            }}
          >
            Payment Provider Sandbox
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: '0.2rem 0' }}>
            Simulated Test Checkout
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Order No: <strong>{order.orderNumber}</strong> &bull; Total: <strong>{formatINR(order.totalAmount)}</strong>
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>Recipient:</strong> {order.guestName} ({order.guestEmail})
          </p>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>Shipping Method:</strong> {order.shippingMethodName}
          </p>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-hairline)' }}>
            <strong>Items Snapshot:</strong>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {order.items.map((i: MockGatewayOrderItem) => (
                <li key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>{i.quantity} × {i.productTitleSnapshot} ({i.variantNameSnapshot})</span>
                  <span>{formatINR(i.priceSnapshot * i.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
          <button
            onClick={handleSimulatePayment}
            disabled={processing}
            className="btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
          >
            {processing ? 'Confirming payment via webhook...' : `Simulate Successful Payment (${formatINR(order.totalAmount)})`}
          </button>

          <Link
            href="/cart?cancelled=1"
            className="btn-secondary"
            style={{ width: '100%', textAlign: 'center', padding: '0.85rem', fontSize: '0.9rem' }}
          >
            Simulate Cancellation (Return to Cart)
          </Link>
        </div>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-hairline)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          Security Notice: Orders are only transitioned to PAID status after a cryptographically signed webhook is validated by the server.
        </div>
      </div>
    </div>
  );
}
