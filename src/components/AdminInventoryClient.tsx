'use client';

import React, { useState } from 'react';

interface AdminInventoryClientProps {
  initialVariants: any[];
}

export default function AdminInventoryClient({ initialVariants }: AdminInventoryClientProps) {
  const [variants, setVariants] = useState(initialVariants);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const handleSaveStock = async (variantId: string) => {
    const stock = parseInt(newStockVal, 10);
    if (isNaN(stock) || stock < 0) return;

    setLoading(true);
    setNotice('');

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, stock }),
      });

      if (!res.ok) {
        throw new Error('Failed to update stock');
      }

      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, stock } : v))
      );
      setEditingId(null);
      setNotice('Stock updated successfully.');
    } catch (err: any) {
      setNotice(err.message || 'Error updating stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {notice && (
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tag)', border: '1px solid var(--border-hairline)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {notice}
        </div>
      )}

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
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Product Title</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Variant & SKU</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Price</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Current Stock</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'right' }}>Quick Adjust</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr
                key={v.id}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <td style={{ padding: '0.85rem 1rem' }}>
                  <strong>{v.product.title}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Category: {v.product.category.name}
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div>{v.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SKU: {v.sku}</div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>${(v.price / 100).toFixed(2)}</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      backgroundColor: v.stock <= 5 ? 'var(--accent-terracotta-soft)' : 'var(--bg-tag)',
                      color: v.stock <= 5 ? 'var(--accent-terracotta)' : 'inherit',
                      fontWeight: v.stock <= 5 ? 600 : 400,
                      fontSize: '0.82rem',
                    }}
                  >
                    {v.stock} units {v.stock <= 5 && '(Low Stock)'}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                  {editingId === v.id ? (
                    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        value={newStockVal}
                        onChange={(e) => setNewStockVal(e.target.value)}
                        style={{ width: '60px', padding: '0.2rem 0.4rem', fontSize: '0.85rem', backgroundColor: 'var(--bg-primary)' }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveStock(v.id)}
                        disabled={loading}
                        className="btn-primary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(v.id);
                        setNewStockVal(v.stock.toString());
                      }}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      Update Units
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
