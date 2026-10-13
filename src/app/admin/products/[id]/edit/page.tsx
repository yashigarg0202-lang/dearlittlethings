'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductImageUploader, { UploadedImageItem } from '@/components/ProductImageUploader';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [materials, setMaterials] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [productionTime, setProductionTime] = useState('');
  const [variationDisclaimer, setVariationDisclaimer] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');
  const [isHandmade, setIsHandmade] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Variant details
  const [variantName, setVariantName] = useState('Standard');
  const [sku, setSku] = useState('');
  const [priceDollars, setPriceDollars] = useState('10.00');
  const [stock, setStock] = useState('20');

  // Images state
  const [images, setImages] = useState<UploadedImageItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setInitialLoading(true);
        // Load categories
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        // Load existing product
        const prodRes = await fetch(`/api/admin/products/${productId}`);
        if (!prodRes.ok) {
          throw new Error('Failed to load product');
        }
        const prodData = await prodRes.json();
        const p = prodData.product;

        setTitle(p.title || '');
        setSlug(p.slug || '');
        setDescription(p.description || '');
        setCategoryId(p.categoryId || '');
        setTags(p.tags || '');
        setMaterials(p.materials || '');
        setDimensions(p.dimensions || '');
        setCareInstructions(p.careInstructions || '');
        setProductionTime(p.productionTime || '');
        setVariationDisclaimer(p.variationDisclaimer || '');
        setStatus(p.status || 'ACTIVE');
        setIsHandmade(p.isHandmade ?? true);
        setIsFeatured(p.isFeatured ?? false);

        if (p.variants && p.variants.length > 0) {
          const v = p.variants[0];
          setVariantName(v.name || 'Standard');
          setSku(v.sku || '');
          setPriceDollars((v.price / 100).toFixed(2));
          setStock(v.stock.toString());
        }

        if (p.images && p.images.length > 0) {
          const loadedImages: UploadedImageItem[] = p.images.map((img: { id: string; url: string; altText: string; isPrimary: boolean; sortOrder: number }) => ({
            id: img.id,
            url: img.url,
            altText: img.altText || '',
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
          }));
          setImages(loadedImages);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error loading product';
        setError(msg);
      } finally {
        setInitialLoading(false);
      }
    }

    loadData();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (images.length === 0) {
        throw new Error('Please include at least one product image.');
      }

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
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
            id: img.id,
            url: img.url,
            altText: img.altText || title.trim(),
            sortOrder: idx,
            isPrimary: img.isPrimary,
          })),
          variantName: variantName.trim(),
          sku: sku.trim(),
          priceDollars: parseFloat(priceDollars),
          stock: parseInt(stock, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      setSuccess('Product changes saved successfully!');
      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating product';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ maxWidth: '860px', margin: '4rem auto', textAlign: 'center', color: 'var(--muted-foreground)' }}>
        <p>Loading studio product details...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
        <Link href="/admin/products" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          &larr; Back to Products
        </Link>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: '0.5rem 0 0.2rem 0' }}>
          Edit Studio Product
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Update photos, reorder images, manage stock limits, and refine product details.
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

      {success && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#edf7ed',
            border: '1px solid #7cb342',
            color: '#33691e',
            marginBottom: '1.5rem',
            borderRadius: '4px',
          }}
        >
          {success}
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
                onChange={(e) => setTitle(e.target.value)}
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
                  {categories.map((c) => (
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
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'DRAFT' | 'ARCHIVED')}
                style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-hairline)' }}
              >
                <option value="ACTIVE">Active (Live in Store)</option>
                <option value="DRAFT">Draft (Hidden)</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Direct Product Image Uploads & Management */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', padding: '1.75rem', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', margin: 0 }}>
              2. Product Visuals & Gallery
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Upload additional images, reorder or change main thumbnail
            </span>
          </div>

          <ProductImageUploader
            images={images}
            onChange={setImages}
            productTitle={title}
          />
        </div>

        {/* 3. Variant & Pricing */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', padding: '1.75rem', borderRadius: '4px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginBottom: '1rem' }}>
            3. Edition & Inventory
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

        {/* 4. Artisanal Attributes */}
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
          <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
            {saving ? 'Saving Changes...' : 'Save Product Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
