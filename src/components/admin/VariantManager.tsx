'use client';

import React from 'react';

export interface VariantFormData {
  id?: string;
  name: string;
  sku: string;
  priceDollars: string;
  compareAtPriceDollars: string;
  stock: string;
}

interface VariantManagerProps {
  hasMultipleVariants: boolean;
  onToggleMultipleVariants: (enabled: boolean) => void;
  variants: VariantFormData[];
  onChangeVariants: (variants: VariantFormData[]) => void;
  baseSku?: string;
}

export default function VariantManager({
  hasMultipleVariants,
  onToggleMultipleVariants,
  variants,
  onChangeVariants,
  baseSku = 'DLT',
}: VariantManagerProps) {
  const handleAddVariant = () => {
    const nextIdx = variants.length + 1;
    const newVariant: VariantFormData = {
      name: `Option ${nextIdx}`,
      sku: `${baseSku}-${String(nextIdx).padStart(2, '0')}`,
      priceDollars: variants[0]?.priceDollars || '12.00',
      compareAtPriceDollars: '',
      stock: '20',
    };
    onChangeVariants([...variants, newVariant]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    const updated = variants.filter((_, idx) => idx !== index);
    onChangeVariants(updated);
  };

  const handleUpdateVariant = (index: number, field: keyof VariantFormData, val: string) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    onChangeVariants(updated);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.25rem 0', color: 'var(--foreground)' }}>
            Variants &amp; Inventory Matrix
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', margin: 0 }}>
            Configure individual pricing, SKUs, and stock quantities for sizes, colors, or materials.
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={hasMultipleVariants}
            onChange={(e) => onToggleMultipleVariants(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
          />
          <span>This product has multiple options</span>
        </label>
      </div>

      {!hasMultipleVariants ? (
        // Single Variant Simple Fields
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Price (USD) *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>$</span>
              <input
                type="number"
                step="0.01"
                min="0.5"
                required
                value={variants[0]?.priceDollars || ''}
                onChange={(e) => handleUpdateVariant(0, 'priceDollars', e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 1.75rem', border: '1px solid var(--border)', borderRadius: '4px' }}
                placeholder="12.00"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Compare-at Price (Sale)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={variants[0]?.compareAtPriceDollars || ''}
                onChange={(e) => handleUpdateVariant(0, 'compareAtPriceDollars', e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 1.75rem', border: '1px solid var(--border)', borderRadius: '4px' }}
                placeholder="Optional strike-through"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              SKU (Stock Keeping Unit) *
            </label>
            <input
              type="text"
              required
              value={variants[0]?.sku || ''}
              onChange={(e) => handleUpdateVariant(0, 'sku', e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px' }}
              placeholder="e.g. DLT-STK-01"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Inventory Stock Quantity *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={variants[0]?.stock || '0'}
              onChange={(e) => handleUpdateVariant(0, 'stock', e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px' }}
              placeholder="e.g. 25"
            />
          </div>
        </div>
      ) : (
        // Multi-variant Table
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(244, 239, 235, 0.5)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.6rem 0.8rem', fontWeight: 600 }}>Option / Variant Name *</th>
                <th style={{ padding: '0.6rem 0.8rem', fontWeight: 600 }}>SKU *</th>
                <th style={{ padding: '0.6rem 0.8rem', fontWeight: 600 }}>Price ($) *</th>
                <th style={{ padding: '0.6rem 0.8rem', fontWeight: 600 }}>Compare ($)</th>
                <th style={{ padding: '0.6rem 0.8rem', fontWeight: 600 }}>Stock *</th>
                <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', width: '50px' }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, idx) => (
                <tr key={idx} style={{ borderBottom: idx < variants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '0.6rem 0.8rem' }}>
                    <input
                      type="text"
                      required
                      value={v.name}
                      onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                      placeholder="e.g. Small / 5x7"
                      style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '3px' }}
                    />
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem' }}>
                    <input
                      type="text"
                      required
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                      placeholder="e.g. DLT-01"
                      style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '3px', fontFamily: 'monospace' }}
                    />
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem', width: '110px' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      required
                      value={v.priceDollars}
                      onChange={(e) => handleUpdateVariant(idx, 'priceDollars', e.target.value)}
                      style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '3px' }}
                    />
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem', width: '110px' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={v.compareAtPriceDollars}
                      onChange={(e) => handleUpdateVariant(idx, 'compareAtPriceDollars', e.target.value)}
                      placeholder="Sale"
                      style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '3px' }}
                    />
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem', width: '90px' }}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={v.stock}
                      onChange={(e) => handleUpdateVariant(idx, 'stock', e.target.value)}
                      style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '3px' }}
                    />
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      disabled={variants.length <= 1}
                      title={variants.length <= 1 ? 'At least one variant is required' : 'Remove variant'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: variants.length <= 1 ? 'not-allowed' : 'pointer',
                        color: variants.length <= 1 ? 'var(--border)' : 'var(--accent-terracotta)',
                        fontSize: '1.1rem',
                        lineHeight: 1,
                      }}
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(244, 239, 235, 0.2)' }}>
            <button
              type="button"
              onClick={handleAddVariant}
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--primary)',
                background: 'none',
                border: '1px dashed var(--primary)',
                borderRadius: '4px',
                padding: '0.4rem 0.85rem',
                cursor: 'pointer',
              }}
            >
              + Add Another Option
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
