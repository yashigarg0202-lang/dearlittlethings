'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { PlusIcon, MinusIcon } from '@/icons';
import { formatINR } from '@/lib/currency';

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeItem,
    applyDiscount,
    removeDiscount,
  } = useCart();

  const [discountInput, setDiscountInput] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [discountSuccess, setDiscountSuccess] = useState('');

  const subtotal = cart?.subtotal || 0;
  const discountAmount = cart?.discountAmount || 0;
  const total = cart?.total || 0;
  const items = cart?.items || [];
  const standardDeliveryFee = 9900; // ₹99 standard delivery fee
  const orderTotal = items.length > 0 ? Math.max(0, total + standardDeliveryFee) : 0;

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountInput.trim()) return;
    setDiscountError('');
    setDiscountSuccess('');
    const res = await applyDiscount(discountInput.trim());
    if (res.success) {
      setDiscountSuccess(res.message || 'Coupon code applied!');
      setDiscountInput('');
    } else {
      setDiscountError(res.message || 'Invalid discount code.');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '6rem', maxWidth: '980px' }}>
      <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', margin: 0 }}>
          Your Shopping Bag
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          {items.length} {items.length === 1 ? 'handmade item' : 'handmade items'} ready for studio dispatch
        </p>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            padding: '5rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-hairline)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.6rem',
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Your bag is currently empty
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '420px', margin: '0 auto 2rem auto' }}>
            Browse our small studio goods — vinyl stickers, solid brass bell keyrings, and tactile crochet cases.
          </p>
          <Link href="/shop" className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
            Discover Goods
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3.5rem',
            alignItems: 'start',
          }}
        >
          {/* Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Delivery notice */}
            <div
              style={{
                padding: '0.85rem 1.25rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.88rem',
              }}
            >
              <span>
                Standard domestic studio delivery: <strong>{formatINR(standardDeliveryFee)}</strong> per order.
              </span>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr auto',
                  gap: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-hairline)',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '90px',
                    height: '110px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-hairline)',
                    overflow: 'hidden',
                  }}
                >
                  {item.variant.product.images[0]?.url ? (
                    <Image
                      src={item.variant.product.images[0].url}
                      alt={item.variant.product.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  ) : null}
                </div>

                <div>
                  <Link
                    href={`/product/${item.variant.product.slug}`}
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.15rem',
                      display: 'block',
                      marginBottom: '0.25rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {item.variant.product.title}
                  </Link>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    {item.variant.name}
                  </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-hairline)', backgroundColor: 'var(--bg-primary)' }}>
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeItem(item.id);
                          } else {
                            updateQuantity(item.id, item.quantity - 1);
                          }
                        }}
                        aria-label={item.quantity <= 1 ? "Remove item" : "Decrease quantity"}
                        style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'none', cursor: 'pointer' }}
                      >
                        <MinusIcon size={12} />
                      </button>
                      <span style={{ padding: '0.1rem 0.6rem', fontSize: '0.9rem', fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          if (item.quantity >= item.variant.stock) return;
                          updateQuantity(item.id, item.quantity + 1);
                        }}
                        disabled={item.quantity >= item.variant.stock}
                        aria-label="Increase quantity"
                        style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'none', cursor: item.quantity >= item.variant.stock ? 'not-allowed' : 'pointer' }}
                      >
                        <PlusIcon size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                      {formatINR(item.variant.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.75rem',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        opacity: 1,
                      }}
                    >
                      Remove
                    </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary & Checkout Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              padding: '2rem',
              position: 'sticky',
              top: '90px',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '1.25rem' }}>
              Order Overview
            </h2>

            {/* Coupon form */}
            <form onSubmit={handleApplyDiscount} style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Coupon code (e.g. WELCOME10)"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.75rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-hairline)',
                    fontSize: '0.85rem',
                  }}
                />
                <button type="submit" className="btn-secondary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                  Apply
                </button>
              </div>
              {discountError && (
                <p style={{ color: '#B6644B', fontSize: '0.8rem', marginTop: '0.4rem' }}>{discountError}</p>
              )}
              {discountSuccess && (
                <p style={{ color: 'var(--accent-sage)', fontSize: '0.8rem', marginTop: '0.4rem' }}>{discountSuccess}</p>
              )}
            </form>

            {cart?.discountCode && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.75rem',
                  backgroundColor: 'var(--bg-tag)',
                  border: '1px solid var(--border-hairline)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                <span>Code: {cart.discountCode}</span>
                <button
                  onClick={removeDiscount}
                  style={{ background: 'none', border: 'none', textDecoration: 'underline', color: 'var(--text-muted)' }}
                >
                  Remove
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Item Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--accent-terracotta)' }}>
                <span>Discount</span>
                <span>-{formatINR(discountAmount)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Standard Delivery</span>
              <span>{formatINR(standardDeliveryFee)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-hairline)',
                fontSize: '1.25rem',
                fontWeight: 600,
                fontFamily: 'var(--font-serif)',
                marginBottom: '1.5rem',
              }}
            >
              <span>Total</span>
              <span>{formatINR(orderTotal)}</span>
            </div>

            <Link
              href="/checkout"
              className="btn-primary"
              style={{ width: '100%', textAlign: 'center', padding: '0.85rem', display: 'block' }}
            >
              Proceed to Secure Checkout
            </Link>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
              Encrypted checkout. Real studio order confirmed via email.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
