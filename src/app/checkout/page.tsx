'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, type CartItemData } from '@/context/CartContext';
import { formatINR } from '@/lib/currency';

interface ShippingRateOption {
  id: string;
  name: string;
  description: string | null;
  rate: number;
  minAmount: number | null;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading: isCartLoading, refreshCart, applyDiscount, removeDiscount } = useCart();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [customerNotes, setCustomerNotes] = useState('');
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [discountMessage, setDiscountMessage] = useState('');

  const [shippingRates, setShippingRates] = useState<ShippingRateOption[]>([]);
  const [selectedRateId, setSelectedRateId] = useState('');
  const [loadingRates, setLoadingRates] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch configured shipping rates
  useEffect(() => {
    async function loadShippingRates() {
      try {
        const res = await fetch('/api/shipping/rates');
        if (res.ok) {
          const data = await res.json();
          setShippingRates(data.rates || []);
          if (data.rates?.length > 0) {
            setSelectedRateId(data.rates[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load shipping rates', err);
      } finally {
        setLoadingRates(false);
      }
    }
    loadShippingRates();
  }, []);

  // Pre-fill user profile if logged in
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const res = await fetch('/api/account/profile');
        if (res.ok) {
          const user = await res.json();
          if (user.email) setEmail(user.email);
          if (user.name) setFullName(user.name);
          if (user.addresses && user.addresses.length > 0) {
            const def = user.addresses[0];
            setFullName(def.fullName || '');
            setPhone(def.phone || '');
            setAddressLine1(def.addressLine1 || '');
            setAddressLine2(def.addressLine2 || '');
            setCity(def.city || '');
            setState(def.state || '');
            setPostalCode(def.postalCode || '');
            setCountry(def.country || 'India');
          }
        }
      } catch {
        // Guest user, ignore
      }
    }
    loadUserProfile();
  }, []);

  const subtotal = cart?.subtotal || 0;
  const discountAmount = cart?.discountAmount || 0;
  const items: CartItemData[] = cart?.items || [];

  const selectedRate = shippingRates.find((r: ShippingRateOption) => r.id === selectedRateId);
  let shippingCost = selectedRate ? selectedRate.rate : (shippingRates[0]?.rate ?? 9900);
  if (selectedRate && selectedRate.minAmount !== null && subtotal >= selectedRate.minAmount) {
    shippingCost = 0;
  }

  const finalTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountCodeInput.trim()) return;
    setDiscountMessage('');
    const res = await applyDiscount(discountCodeInput.trim());
    if (res.success) {
      setDiscountMessage(`Coupon applied: ${discountCodeInput.toUpperCase()}`);
      setDiscountCodeInput('');
    } else {
      setDiscountMessage(res.message || 'Invalid discount coupon');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Please enter your contact phone or WhatsApp number.');
      return;
    }

    if (!addressLine1.trim()) {
      setErrorMessage('Please enter your delivery street address.');
      return;
    }

    if (!city.trim()) {
      setErrorMessage('Please enter your city.');
      return;
    }

    if (!postalCode.trim()) {
      setErrorMessage('Please enter your PIN code / postal code.');
      return;
    }

    if (!selectedRateId && shippingRates.length > 0) {
      setErrorMessage('Please select a delivery option.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim(),
          state: state.trim() || undefined,
          postalCode: postalCode.trim(),
          country: country.trim() || 'India',
          shippingRateId: selectedRateId || (shippingRates[0]?.id ?? 'default'),
          customerNotes: customerNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit order request.');
      }

      await refreshCart();
      router.push(`/order-confirmation/${data.orderNumber}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout failed. Please check your information.';
      setErrorMessage(message);
      setSubmitting(false);
    }
  };

  if (!isCartLoading && items.length === 0) {
    return (
      <div style={{ maxWidth: '40rem', margin: '6rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <p className="font-accent" style={{ fontSize: '1.75rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          your little bag
        </p>
        <h1 className="font-display" style={{ fontSize: '2.5rem', fontStyle: 'italic', fontWeight: 400, marginBottom: '1.5rem' }}>
          is empty right now.
        </h1>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '2.5rem' }}>
          Explore our stickers, charms, and slow-crochet goods before submitting your request.
        </p>
        <Link href="/shop" className="btn-ink">
          browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '3.5rem 1.5rem 8rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '3.5rem' }}>
        <p className="font-accent" style={{ fontSize: '1.5rem', color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>
          direct studio order
        </p>
        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: 400,
            fontStyle: 'italic',
            lineHeight: 1.1,
            margin: '0 0 0.75rem 0',
            color: 'var(--foreground)',
          }}
        >
          submit order request.
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--muted-foreground)', maxWidth: '42rem', lineHeight: '1.6', margin: 0 }}>
          Submit your order details below. We will personally check studio stock, confirm your pieces, and contact you directly to arrange payment and delivery.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(168, 90, 68, 0.1)',
            border: '1px solid var(--primary)',
            color: 'var(--primary)',
            borderRadius: '4px',
            fontSize: '0.875rem',
            marginBottom: '2rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '4rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Customer & Delivery Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* 1. Customer Contact Details */}
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '2rem',
              }}
            >
              <h2
                className="font-display"
                style={{
                  fontSize: '1.5rem',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  margin: '0 0 1.5rem 0',
                  color: 'var(--foreground)',
                }}
              >
                1. your contact details
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maya Sharma"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      color: 'var(--foreground)',
                      fontSize: '0.9375rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="maya@example.com"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--foreground)',
                        fontSize: '0.9375rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--foreground)',
                        fontSize: '0.9375rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Delivery Address */}
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '2rem',
              }}
            >
              <h2
                className="font-display"
                style={{
                  fontSize: '1.5rem',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  margin: '0 0 1.5rem 0',
                  color: 'var(--foreground)',
                }}
              >
                2. delivery address
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="House / Flat No., Street, Landmark"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      color: 'var(--foreground)',
                      fontSize: '0.9375rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Apartment, floor, or suite (optional)
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Apt 4B, 2nd Floor"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      color: 'var(--foreground)',
                      fontSize: '0.9375rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai, Bengaluru"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--foreground)',
                        fontSize: '0.9375rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      State / Region
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Karnataka"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--foreground)',
                        fontSize: '0.9375rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="560001"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--foreground)',
                        fontSize: '0.9375rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="India"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--foreground)',
                        fontSize: '0.9375rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Delivery Method */}
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '2rem',
              }}
            >
              <h2
                className="font-display"
                style={{
                  fontSize: '1.5rem',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  margin: '0 0 1.5rem 0',
                  color: 'var(--foreground)',
                }}
              >
                3. delivery method
              </h2>

              {loadingRates ? (
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>Loading delivery options...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {shippingRates.map((rate: ShippingRateOption) => {
                    const isQualifyingFree = rate.minAmount !== null && subtotal >= rate.minAmount;
                    const displayCost = isQualifyingFree ? 0 : rate.rate;

                    return (
                      <label
                        key={rate.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          padding: '1rem',
                          borderRadius: '4px',
                          border: selectedRateId === rate.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: selectedRateId === rate.id ? 'rgba(168, 90, 68, 0.05)' : 'var(--background)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <input
                          type="radio"
                          name="shippingRate"
                          value={rate.id}
                          checked={selectedRateId === rate.id}
                          onChange={() => setSelectedRateId(rate.id)}
                          style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', fontWeight: 500 }}>
                            <span style={{ color: 'var(--foreground)' }}>{rate.name}</span>
                            <span style={{ color: displayCost === 0 ? 'var(--primary)' : 'var(--foreground)' }}>
                              {displayCost === 0 ? 'FREE' : formatINR(displayCost)}
                            </span>
                          </div>
                          {rate.description && (
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0 0' }}>
                              {rate.description}
                            </p>
                          )}
                          {rate.estimatedDaysMin && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                              Estimated: {rate.estimatedDaysMin}&ndash;{rate.estimatedDaysMax} business days
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Optional Order Notes */}
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '2rem',
              }}
            >
              <h2
                className="font-display"
                style={{
                  fontSize: '1.5rem',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  margin: '0 0 1rem 0',
                  color: 'var(--foreground)',
                }}
              >
                4. order notes (optional)
              </h2>
              <textarea
                rows={3}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Gift message, packaging instructions, or anything you'd like us to know..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--foreground)',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Right Column: Order Summary & Submission */}
          <div
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '2rem',
              position: 'sticky',
              top: '90px',
            }}
          >
            <h2
              className="font-display"
              style={{
                fontSize: '1.75rem',
                fontStyle: 'italic',
                fontWeight: 400,
                margin: '0 0 1.5rem 0',
                color: 'var(--foreground)',
              }}
            >
              order summary
            </h2>

            {/* Item list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
              {items.map((item: CartItemData) => {
                const prodImages = item.variant?.product?.images || [];
                const image = prodImages.find((img) => (img as { isPrimary?: boolean }).isPrimary)?.url || prodImages[0]?.url;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.875rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {image && (
                        <div
                          style={{
                            width: '40px',
                            height: '50px',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            backgroundColor: 'var(--secondary)',
                            flexShrink: 0,
                            border: '1px solid var(--border)',
                          }}
                        >
                          <img
                            src={image}
                            alt={item.variant.product.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <div>
                        <strong style={{ color: 'var(--foreground)' }}>
                          {item.quantity} &times; {item.variant.product.title}
                        </strong>
                        {item.variant.name && item.variant.name !== 'Default' && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                            {item.variant.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{ fontWeight: 500, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                      {formatINR(item.variant.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Discount Code Form */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Discount coupon"
                  value={discountCodeInput}
                  onChange={(e) => setDiscountCodeInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    color: 'var(--foreground)',
                    textTransform: 'uppercase',
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="btn-ink"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                >
                  apply
                </button>
              </div>
              {discountMessage && (
                <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.35rem' }}>
                  {discountMessage}
                </p>
              )}
            </div>

            {/* Price Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Items Subtotal</span>
                <span style={{ color: 'var(--foreground)' }}>{formatINR(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--primary)' }}>
                  <span>
                    Discount ({cart?.discountCode}){' '}
                    <button
                      type="button"
                      onClick={() => removeDiscount()}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      remove
                    </button>
                  </span>
                  <span>-{formatINR(discountAmount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Delivery ({selectedRate?.name || 'Standard'})</span>
                <span style={{ color: shippingCost === 0 ? 'var(--primary)' : 'var(--foreground)' }}>
                  {shippingCost === 0 ? 'FREE' : formatINR(shippingCost)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)',
                  fontSize: '1.35rem',
                  fontWeight: 400,
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--foreground)',
                  marginTop: '0.5rem',
                }}
              >
                <span>Estimated Total</span>
                <span>{formatINR(finalTotal)}</span>
              </div>
            </div>

            {/* Submit Order Request Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-ink"
              style={{
                width: '100%',
                padding: '0.95rem',
                fontSize: '1rem',
                letterSpacing: '0.04em',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'submitting request...' : 'submit order request'}
            </button>

            {/* Reassuring Order Request Note */}
            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.875rem 1rem',
                backgroundColor: 'rgba(244, 239, 235, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '0.8125rem',
                color: 'var(--muted-foreground)',
                lineHeight: '1.5',
                textAlign: 'center',
              }}
            >
              No online card payment is taken now. We will personally review your pieces, check studio inventory, and contact you via email or phone to confirm your order and arrange payment and delivery.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
