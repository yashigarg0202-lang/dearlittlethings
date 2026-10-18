'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, type CartItemData } from '@/context/CartContext';
import { formatINR } from '@/lib/currency';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
  } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const items: CartItemData[] = cart?.items || [];
  const itemCount = items.reduce((sum: number, item: CartItemData) => sum + item.quantity, 0);
  const subtotal = cart?.subtotal || 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="your little bag"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={closeCart}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(58, 43, 36, 0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          backgroundColor: 'var(--background)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(58, 43, 36, 0.15)',
          zIndex: 1001,
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '2rem 1.75rem 1.25rem 1.75rem',
            borderBottom: '1px solid var(--border)',
            position: 'relative',
          }}
        >
          <button
            onClick={closeCart}
            aria-label="Close bag"
            style={{
              position: 'absolute',
              right: '1.5rem',
              top: '1.75rem',
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--foreground)',
              cursor: 'pointer',
              opacity: 0.7,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
          <h2
            className="font-display"
            style={{
              fontSize: '1.85rem',
              fontStyle: 'italic',
              fontWeight: 'normal',
              margin: 0,
              color: 'var(--foreground)',
            }}
          >
            your little bag
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--muted-foreground)',
              marginTop: '0.25rem',
              marginBottom: 0,
            }}
          >
            {itemCount === 0
              ? 'nothing here yet.'
              : `${itemCount} small thing${itemCount === 1 ? '' : 's'}, waiting for you`}
          </p>
        </div>

        {/* Items List or Empty State */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem 1.75rem',
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '1rem',
              }}
            >
              <p
                className="font-accent"
                style={{
                  fontSize: '1.75rem',
                  color: 'var(--muted-foreground)',
                  margin: 0,
                }}
              >
                go find something lovely ✿
              </p>
              <button
                onClick={closeCart}
                className="link-quiet"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--foreground)',
                  background: 'none',
                  border: 'none',
                }}
              >
                ← browse the collection
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {items.map((item: CartItemData) => {
                const prodImages = item.variant?.product?.images || [];
                const image = prodImages.find((img) => (img as { isPrimary?: boolean }).isPrimary)?.url || prodImages[0]?.url;
                const title = item.variant?.product?.title || 'Handmade Item';
                const variantName = item.variant?.name;
                const price = item.variant?.price || 0;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      borderBottom: '1px solid var(--border)',
                      paddingBottom: '1.25rem',
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        position: 'relative',
                        width: '4.5rem',
                        height: '5.5rem',
                        flexShrink: 0,
                        backgroundColor: 'var(--secondary)',
                        overflow: 'hidden',
                        borderRadius: '2px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {image ? (
                        <Image
                          src={image}
                          alt={title}
                          fill
                          sizes="72px"
                          style={{
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          photo
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        className="font-display"
                        style={{
                          fontSize: '1.05rem',
                          lineHeight: 1.25,
                          margin: 0,
                          color: 'var(--foreground)',
                        }}
                      >
                        {title}
                      </h4>
                      {variantName && variantName !== 'Default Title' && (
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--muted-foreground)',
                            marginTop: '0.15rem',
                            marginBottom: 0,
                          }}
                        >
                          {variantName}
                        </p>
                      )}
                      <p
                        style={{
                          fontSize: '0.9rem',
                          color: 'var(--foreground)',
                          marginTop: '0.35rem',
                          marginBottom: 0,
                        }}
                      >
                        {formatINR(price)}
                      </p>

                      {/* Quantity Stepper */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginTop: '0.5rem',
                          backgroundColor: 'var(--secondary)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '2px',
                        }}
                      >
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeItem(item.id);
                            } else {
                              updateQuantity(item.id, item.quantity - 1);
                            }
                          }}
                          aria-label={item.quantity <= 1 ? `Remove ${title} from bag` : "Decrease quantity"}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '0 0.25rem',
                            color: 'var(--foreground)',
                          }}
                        >
                          –
                        </button>
                        <span style={{ fontSize: '0.85rem', minWidth: '1rem', textAlign: 'center', fontWeight: 500 }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            if (item.quantity >= item.variant.stock) return;
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                          disabled={item.quantity >= item.variant.stock}
                          aria-label="Increase quantity"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: item.quantity >= item.variant.stock ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem',
                            padding: '0 0.25rem',
                            color: 'var(--foreground)',
                            opacity: item.quantity >= item.variant.stock ? 0.35 : 1,
                          }}
                          title={item.quantity >= item.variant.stock ? `Max stock available (${item.variant.stock})` : undefined}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${title} from bag`}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted-foreground)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0 0.25rem',
                        transition: 'color 0.15s ease',
                      }}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Subtotal, Delivery Fee & Estimated Total */}
        {items.length > 0 && (() => {
          const standardDeliveryFee = 9900; // ₹99 standard studio delivery fee
          const discountAmt = cart?.discountAmount || 0;
          const orderTotal = Math.max(0, (cart?.total ?? subtotal) + standardDeliveryFee);

          return (
            <div
              style={{
                padding: '1.25rem 1.75rem',
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  color: 'var(--muted-foreground)',
                }}
              >
                <span>Subtotal</span>
                <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                  {formatINR(subtotal)}
                </span>
              </div>

              {discountAmt > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    color: 'var(--primary)',
                  }}
                >
                  <span>Studio Discount</span>
                  <span>-{formatINR(discountAmt)}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  color: 'var(--muted-foreground)',
                }}
              >
                <span>Standard Delivery</span>
                <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                  {formatINR(standardDeliveryFee)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  paddingTop: '0.65rem',
                  borderTop: '1px solid var(--border)',
                  marginTop: '0.2rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: 'var(--foreground)',
                    fontWeight: 600,
                  }}
                >
                  Total
                </span>
                <span
                  className="font-display"
                  style={{
                    fontSize: '1.35rem',
                    color: 'var(--foreground)',
                  }}
                >
                  {formatINR(orderTotal)}
                </span>
              </div>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn-ink"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  marginTop: '0.4rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                }}
              >
                proceed to checkout
              </Link>
            </div>
          );
        })()}
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
