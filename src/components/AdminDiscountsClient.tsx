'use client';

import React, { useState } from 'react';

interface AdminDiscountsClientProps {
  initialDiscounts: any[];
}

export default function AdminDiscountsClient({ initialDiscounts }: AdminDiscountsClientProps) {
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [value, setValue] = useState('15');
  const [minSpend, setMinSpend] = useState('20');
  const [maxUses, setMaxUses] = useState('100');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice('');

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          description: description.trim() || undefined,
          discountType,
          value: parseFloat(value),
          minSpendDollars: minSpend ? parseFloat(minSpend) : undefined,
          maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create discount');
      }

      setDiscounts((prev) => [data.discount, ...prev]);
      setCode('');
      setDescription('');
      setNotice(`Coupon code "${data.discount.code}" created and active!`);
    } catch (err: any) {
      setNotice(err.message || 'Error creating coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
      {/* Existing Coupons Table */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '1rem' }}>
          Active Codes
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {discounts.map((d) => (
            <div
              key={d.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '1.15rem', fontFamily: 'monospace' }}>{d.code}</strong>
                <span
                  style={{
                    padding: '0.15rem 0.45rem',
                    backgroundColor: d.isActive ? 'var(--accent-sage-light)' : 'var(--bg-tag)',
                    color: d.isActive ? 'var(--accent-sage)' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {d.isActive ? 'Active' : 'Expired'}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                {d.description || 'Promotional reduction'}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>
                  Value: {d.discountType === 'PERCENTAGE' ? `${d.value}% off` : `$${(d.value / 100).toFixed(2)} off`}
                </span>
                <span>
                  Redemptions: {d.currentUses} {d.maxUses ? `/ ${d.maxUses}` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Code Form */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          padding: '1.75rem',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
          + Create Coupon Code
        </h2>

        {notice && (
          <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-tag)', border: '1px solid var(--border-hairline)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {notice}
          </div>
        )}

        <form onSubmit={handleCreateDiscount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
              Coupon Code (e.g. AUTUMN15) *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)', textTransform: 'uppercase' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Discount Type *
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Value ({discountType === 'PERCENTAGE' ? '%' : '$'}) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Min Spend ($)
              </label>
              <input
                type="number"
                step="1"
                value={minSpend}
                onChange={(e) => setMinSpend(e.target.value)}
                placeholder="20"
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Max Uses
              </label>
              <input
                type="number"
                step="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="100"
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 15% off seasonal autumn studio drop"
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Creating...' : 'Create Coupon Code'}
          </button>
        </form>
      </div>
    </div>
  );
}
