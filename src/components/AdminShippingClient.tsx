'use client';

import React, { useState } from 'react';
import { formatINR } from '@/lib/currency';

export interface AdminShippingRateItem {
  id: string;
  name: string;
  description?: string | null;
  rate: number;
  minAmount?: number | null;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
  isActive: boolean;
}

export interface AdminShippingZoneItem {
  id: string;
  name: string;
  countries: string;
  rates: AdminShippingRateItem[];
}

interface AdminShippingClientProps {
  initialZones: AdminShippingZoneItem[];
}

export default function AdminShippingClient({ initialZones }: AdminShippingClientProps) {
  const [zones, setZones] = useState<AdminShippingZoneItem[]>(initialZones);
  const [selectedZoneId, setSelectedZoneId] = useState(initialZones[0]?.id || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rateDollars, setRateDollars] = useState('5.00');
  const [minAmountDollars, setMinAmountDollars] = useState('');
  const [daysMin, setDaysMin] = useState('2');
  const [daysMax, setDaysMax] = useState('4');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZoneId) return;
    setLoading(true);
    setNotice('');

    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: selectedZoneId,
          name: name.trim(),
          description: description.trim() || undefined,
          rateDollars: parseFloat(rateDollars),
          minAmountDollars: minAmountDollars ? parseFloat(minAmountDollars) : undefined,
          estimatedDaysMin: daysMin ? parseInt(daysMin, 10) : undefined,
          estimatedDaysMax: daysMax ? parseInt(daysMax, 10) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create rate');
      }

      setZones((prev: AdminShippingZoneItem[]) =>
        prev.map((z: AdminShippingZoneItem) =>
          z.id === selectedZoneId ? { ...z, rates: [...z.rates, data.rate] } : z
        )
      );

      setName('');
      setDescription('');
      setNotice(`Shipping rate "${data.rate.name}" added successfully!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving rate';
      setNotice(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
      {/* Existing Zones & Rates */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '1rem' }}>
          Configured Zones & Rates
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {zones.map((z: AdminShippingZoneItem) => (
            <div
              key={z.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                padding: '1.5rem',
              }}
            >
              <strong style={{ fontSize: '1.15rem', display: 'block', marginBottom: '0.2rem' }}>
                {z.name}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Countries: {z.countries}
              </span>

              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {z.rates.map((r: AdminShippingRateItem) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '0.65rem',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-hairline)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong>{r.name}</strong>
                      {r.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{r.description}</div>}
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 600 }}>
                      {r.rate === 0 ? 'Free' : formatINR(r.rate)}
                      {r.minAmount && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-sage)', fontWeight: 400 }}>
                          (Orders over ${formatINR(r.minAmount)})
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Rate Form */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          padding: '1.75rem',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
          + Add New Shipping Rate
        </h2>

        {notice && (
          <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-tag)', border: '1px solid var(--border-hairline)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {notice}
          </div>
        )}

        <form onSubmit={handleCreateRate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
              Select Zone *
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
              Rate Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Express Studio Courier"
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Rate Cost (₹) *
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                required
                value={rateDollars}
                onChange={(e) => setRateDollars(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Free Above Threshold (₹)
              </label>
              <input
                type="number"
                step="1"
                value={minAmountDollars}
                onChange={(e) => setMinAmountDollars(e.target.value)}
                placeholder="e.g. 50"
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Min Est. Days
              </label>
              <input
                type="number"
                value={daysMin}
                onChange={(e) => setDaysMin(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Max Est. Days
              </label>
              <input
                type="number"
                value={daysMax}
                onChange={(e) => setDaysMax(e.target.value)}
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
              placeholder="e.g. Cardboard protected dispatch with tracking number"
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Adding...' : 'Add Rate Tier'}
          </button>
        </form>
      </div>
    </div>
  );
}
