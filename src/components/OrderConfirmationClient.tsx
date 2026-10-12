'use client';

import React from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/currency';

interface OrderConfirmationClientProps {
  order: any;
  address: any;
}

export default function OrderConfirmationClient({
  order,
  address,
}: OrderConfirmationClientProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* 1. Thank You Header Card */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '3rem 2rem',
          marginBottom: '2.5rem',
          textAlign: 'center',
        }}
      >
        <p
          className="font-accent"
          style={{
            fontSize: '1.75rem',
            color: 'var(--primary)',
            margin: '0 0 0.5rem 0',
          }}
        >
          order request received
        </p>

        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(2.25rem, 4.5vw, 3.25rem)',
            fontWeight: 400,
            fontStyle: 'italic',
            lineHeight: 1.1,
            margin: '0 0 1rem 0',
            color: 'var(--foreground)',
          }}
        >
          thank you, {order.guestName || 'friend'}.
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'var(--muted-foreground)',
            maxWidth: '34rem',
            margin: '0 auto 1.5rem auto',
            lineHeight: '1.6',
          }}
        >
          Your request has been safely registered under reference number{' '}
          <strong style={{ color: 'var(--foreground)' }}>#{order.orderNumber}</strong>.
        </p>

        <div style={{ display: 'inline-block', marginBottom: '2rem' }}>
          <span
            style={{
              padding: '0.4rem 1.25rem',
              backgroundColor: 'rgba(168, 90, 68, 0.12)',
              color: 'var(--primary)',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {order.status || 'Pending Confirmation'}
          </span>
        </div>

        {/* 3-Step Process Indicator */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem',
            textAlign: 'left',
            maxWidth: '44rem',
            margin: '0 auto 2rem auto',
            padding: '1.5rem',
            backgroundColor: 'rgba(244, 239, 235, 0.6)',
            borderRadius: '4px',
            border: '1px solid var(--border)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--primary)', fontWeight: 600 }}>
              STEP 1 &bull; COMPLETE
            </div>
            <div style={{ fontWeight: 500, fontSize: '0.9375rem', marginTop: '0.25rem', color: 'var(--foreground)' }}>
              Request Received
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.2rem' }}>
              Saved in our studio log
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--primary)', fontWeight: 600 }}>
              STEP 2 &bull; NEXT
            </div>
            <div style={{ fontWeight: 500, fontSize: '0.9375rem', marginTop: '0.25rem', color: 'var(--foreground)' }}>
              Studio Contact
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.2rem' }}>
              We will email or message you shortly
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--muted-foreground)', fontWeight: 600 }}>
              STEP 3 &bull; UPCOMING
            </div>
            <div style={{ fontWeight: 500, fontSize: '0.9375rem', marginTop: '0.25rem', color: 'var(--foreground)' }}>
              Payment &amp; Dispatch
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.2rem' }}>
              Arranged personally with you
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            print receipt
          </button>

          <Link href="/shop" className="btn-ink">
            browse the collection
          </Link>
        </div>
      </div>

      {/* 2. Order Details & Financial Breakdown */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '2.5rem 2rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2
            className="font-display"
            style={{
              fontSize: '1.5rem',
              fontStyle: 'italic',
              fontWeight: 400,
              margin: 0,
              color: 'var(--foreground)',
            }}
          >
            items requested
          </h2>
          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            Reference: #{order.orderNumber}
          </span>
        </div>

        {/* Item Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
          {order.items.map((item: any) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border)',
                fontSize: '0.9375rem',
              }}
            >
              <div>
                <strong style={{ color: 'var(--foreground)' }}>
                  {item.quantity} &times; {item.productTitleSnapshot}
                </strong>
                {item.variantNameSnapshot && item.variantNameSnapshot !== 'Default' && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                    {item.variantNameSnapshot}
                  </div>
                )}
              </div>
              <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>
                {formatINR(item.priceSnapshot * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Calculations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Items Subtotal</span>
            <span style={{ color: 'var(--foreground)' }}>{formatINR(order.subtotalAmount)}</span>
          </div>

          {order.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--primary)' }}>
              <span>Discount ({order.discountCodeUsed})</span>
              <span>-{formatINR(order.discountAmount)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Delivery ({order.shippingMethodName || 'Standard'})</span>
            <span style={{ color: order.shippingAmount === 0 ? 'var(--primary)' : 'var(--foreground)' }}>
              {order.shippingAmount === 0 ? 'FREE' : formatINR(order.shippingAmount)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border)',
              fontSize: '1.35rem',
              fontWeight: 400,
              fontFamily: 'var(--font-serif)',
              color: 'var(--foreground)',
              marginTop: '0.25rem',
            }}
          >
            <span>Estimated Total</span>
            <span>{formatINR(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* 3. Customer & Delivery Destination Details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '2rem',
        }}
      >
        <div>
          <h3
            className="font-display"
            style={{
              fontSize: '1.25rem',
              fontStyle: 'italic',
              fontWeight: 400,
              margin: '0 0 0.5rem 0',
              color: 'var(--foreground)',
            }}
          >
            delivery address
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: '1.6', margin: 0 }}>
            {address.fullName}<br />
            {address.addressLine1} {address.addressLine2 || ''}<br />
            {address.city}{address.state ? `, ${address.state}` : ''} {address.postalCode}<br />
            {address.country || 'India'}
          </p>
        </div>

        <div>
          <h3
            className="font-display"
            style={{
              fontSize: '1.25rem',
              fontStyle: 'italic',
              fontWeight: 400,
              margin: '0 0 0.5rem 0',
              color: 'var(--foreground)',
            }}
          >
            contact details
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: '1.6', margin: 0 }}>
            <strong>Email:</strong> {order.guestEmail}<br />
            <strong>Phone / WhatsApp:</strong> {order.guestPhone || address.phone || 'Provided'}<br />
            {order.customerNotes && (
              <>
                <strong style={{ display: 'block', marginTop: '0.5rem' }}>Note:</strong>
                <span style={{ fontStyle: 'italic' }}>&ldquo;{order.customerNotes}&rdquo;</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
