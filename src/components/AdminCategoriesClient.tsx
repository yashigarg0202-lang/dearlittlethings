'use client';

import React, { useState } from 'react';

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  introText?: string | null;
  _count: { products: number };
}

export interface AdminCollectionRow {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
}

interface AdminCategoriesClientProps {
  initialCategories: AdminCategoryRow[];
  initialCollections: AdminCollectionRow[];
}

export default function AdminCategoriesClient({
  initialCategories,
  initialCollections,
}: AdminCategoriesClientProps) {
  const [categories, setCategories] = useState<AdminCategoryRow[]>(initialCategories);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [introText, setIntroText] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    );
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice('');

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          introText: introText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create category');
      }

      setCategories((prev: AdminCategoryRow[]) => [...prev, { ...data.category, _count: { products: 0 } }]);
      setName('');
      setSlug('');
      setIntroText('');
      setNotice(`Category "${data.category.name}" created and immediately live!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating category';
      setNotice(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
      {/* Categories List */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '1rem' }}>
          Active Categories ({categories.length})
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {categories.map((c: AdminCategoryRow) => (
            <div
              key={c.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)' }}>{c.name}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {c._count.products} products
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.5rem 0' }}>
                Slug: <code>/category/{c.slug}</code>
              </div>
              {c.introText && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {c.introText}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add New Category Form */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          padding: '1.75rem',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
          + Add New Category
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Adding a category automatically exposes it in the store header and navigation menus.
        </p>

        {notice && (
          <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-tag)', border: '1px solid var(--border-hairline)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {notice}
          </div>
        )}

        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Ceramic Pins"
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
              Slug *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
              Editorial Intro Description
            </label>
            <textarea
              rows={3}
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              placeholder="A few lines describing this craft medium..."
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Creating...' : 'Create Category'}
          </button>
        </form>
      </div>
    </div>
  );
}
