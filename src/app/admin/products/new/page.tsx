'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductImageUploader, { UploadedImageItem } from '@/components/ProductImageUploader';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('handmade,studio,botanical');
  const [materials, setMaterials] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [productionTime, setProductionTime] = useState('Ready to ship in 1-2 business days');
  const [variationDisclaimer, setVariationDisclaimer] = useState('Handcrafted; subtle differences in color or texture are celebrated.');
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT'>('ACTIVE');
  const [isHandmade, setIsHandmade] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Variant details
  const [variantName, setVariantName] = useState('Standard');
  const [sku, setSku] = useState('');
  const [priceDollars, setPriceDollars] = useState('499.00');
  const [stock, setStock] = useState('20');

  // Product Images state (direct uploads + reordering + primary selection)
  const [images, setImages] = useState<UploadedImageItem[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          if (data.categories?.length > 0) {
            setCategoryId(data.categories[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  // Auto-generate slug and SKU from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generatedSlug);

    const generatedSku =
      val
        .split(' ')
        .filter(Boolean)
        .map((w) => w.slice(0, 3).toUpperCase())
        .join('-') + '-01';
    setSku(generatedSku || 'SKU-01');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (images.length === 0) {
        throw new Error('Please upload at least one product image.');
      }

      const primaryImg = images.find((i) => i.isPrimary) || images[0];

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim(),
          categoryId,
          tags: tags.trim(),
          materials: materials.trim(),
          dimensions: dimensions.trim(),
          careInstructions: careInstructions.trim(),
          isHandmade,
          productionTime: productionTime.trim(),
          variationDisclaimer: variationDisclaimer.trim(),
          status,
          isFeatured,
          images: images.map((img, idx) => ({
            url: img.url,
            altText: img.altText || title.trim(),
            sortOrder: idx,
            isPrimary: img.isPrimary,
          })),
          imageUrl: primaryImg.url,
          imageAlt: primaryImg.altText || title.trim(),
          variantName: variantName.trim(),
          sku: sku.trim(),
          priceDollars: parseFloat(priceDollars),
          stock: parseInt(stock, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating product';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
        <Link href="/admin/products" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          &larr; Back to Products
        </Link>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: '0.5rem 0 0.2rem 0' }}>
          Craft New Studio Product
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Upload photos directly from your device, configure editions, stock, and artisanal details.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--accent-terracotta-soft, #fdf0ed)',
            border: '1px solid var(--accent-terracotta, #a85a44)',
            color: 'var(--accent-terracotta, #a85a44)',
            marginBottom: '1.5rem',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* 1. Core Identity */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', padding: '1.75rem', borderRadius: '4px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginBottom: '1rem' }}>
            1. Core Identity
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Product Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Herbarium Study Washi Tape"
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                  URL Slug *
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
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
                >
                  {categories.map((c: { id: string; name: string }) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Editorial Description *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the tactile quality, intended daily use, and small studio details..."
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>
          </div>
        </div>

        {/* 2. Direct Product Image Uploads */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', padding: '1.75rem', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', margin: 0 }}>
              2. Product Visuals & Gallery
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Direct upload from your computer
            </span>
          </div>

          <ProductImageUploader
            images={images}
            onChange={setImages}
            productTitle={title}
          />
        </div>

        {/* 3. Initial Variant & Pricing */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', padding: '1.75rem', borderRadius: '4px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginBottom: '1rem' }}>
            3. Initial Edition & Inventory
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Edition / Variant Name *
              </label>
              <input
                type="text"
                required
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="Standard / Original"
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                SKU *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Price in INR (₹) *
              </label>
              <input
                type="number"
                step="0.25"
                min="0.5"
                required
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Stock Units *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>
          </div>
        </div>

        {/* 4. Handmade Attributes */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', padding: '1.75rem', borderRadius: '4px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginBottom: '1rem' }}>
            4. Artisanal Attributes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                  Materials
                </label>
                <input
                  type="text"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="e.g. Japanese washi paper, archival ink"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                  Dimensions
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="e.g. 50mm x 75mm die-cut"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Care Instructions
              </label>
              <input
                type="text"
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                placeholder="e.g. Wipe gently with dry cloth. Avoid prolonged direct sun."
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isHandmade}
                  onChange={(e) => setIsHandmade(e.target.checked)}
                />
                <span style={{ fontSize: '0.9rem' }}>Mark as Handmade piece</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <span style={{ fontSize: '0.9rem' }}>Pin to Homepage Featured</span>
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Link href="/admin/products" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
            {loading ? 'Creating & Publishing...' : 'Publish Product Live'}
          </button>
        </div>
      </form>
    </div>
  );
}
