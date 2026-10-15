'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductImageUploader, { UploadedImageItem } from '@/components/ProductImageUploader';
import RichTextEditor from './RichTextEditor';
import VariantManager, { VariantFormData } from './VariantManager';

export interface ProductFormData {
  id?: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  collections?: string[];
  tags: string;
  materials: string;
  dimensions: string;
  careInstructions: string;
  productionTime: string;
  variationDisclaimer: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  isHandmade: boolean;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  images: UploadedImageItem[];
  variants: VariantFormData[];
}

interface ProductFormProps {
  initialData?: ProductFormData;
  categories: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  isEditing?: boolean;
}

export default function ProductForm({
  initialData,
  categories,
  collections,
  isEditing = false,
}: ProductFormProps) {
  const router = useRouter();

  // Core product state
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || categories[0]?.id || '');
  const [selectedCollections, setSelectedCollections] = useState<string[]>(initialData?.collections || []);
  const [tags, setTags] = useState(initialData?.tags || 'handmade,studio,botanical');
  const [materials, setMaterials] = useState(initialData?.materials || '');
  const [dimensions, setDimensions] = useState(initialData?.dimensions || '');
  const [careInstructions, setCareInstructions] = useState(initialData?.careInstructions || '');
  const [productionTime, setProductionTime] = useState(
    initialData?.productionTime || 'Ready to ship in 1-2 business days'
  );
  const [variationDisclaimer, setVariationDisclaimer] = useState(
    initialData?.variationDisclaimer ||
      'Handcrafted; subtle differences in color or texture are celebrated as part of studio craft.'
  );
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>(initialData?.status || 'ACTIVE');
  const [isHandmade, setIsHandmade] = useState(initialData?.isHandmade !== undefined ? initialData.isHandmade : true);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);

  // SEO
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || '');

  // Images
  const [images, setImages] = useState<UploadedImageItem[]>(initialData?.images || []);

  // Variants
  const [hasMultipleVariants, setHasMultipleVariants] = useState<boolean>(
    (initialData?.variants && initialData.variants.length > 1) || false
  );
  const [variants, setVariants] = useState<VariantFormData[]>(
    initialData?.variants && initialData.variants.length > 0
      ? initialData.variants
      : [
          {
            name: 'Standard',
            sku: 'DLT-01',
            priceDollars: '12.00',
            compareAtPriceDollars: '',
            stock: '20',
          },
        ]
  );

  // Form State
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Mark form as dirty when any field changes
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Warn user on leaving page with unsaved edits
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved product changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle Title changes and auto-generate slug & SKU if new
  const handleTitleChange = (val: string) => {
    setTitle(val);
    markDirty();

    if (!isEditing || !slug) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);

      if (!seoTitle) {
        setSeoTitle(val);
      }
    }
  };

  const handleCollectionToggle = (colId: string) => {
    markDirty();
    setSelectedCollections((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const handleSave = async (targetStatus?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED') => {
    setErrorMessage('');
    setSuccessMessage('');

    const finalStatus = targetStatus || status;

    if (!title.trim()) {
      setErrorMessage('Please provide a product title.');
      return;
    }

    if (!slug.trim()) {
      setErrorMessage('Please provide a valid product URL handle (slug).');
      return;
    }

    if (!categoryId) {
      setErrorMessage('Please assign a category to this product.');
      return;
    }

    if (images.length === 0) {
      setErrorMessage('Please upload at least one product image.');
      return;
    }

    // Validate variants
    for (const v of variants) {
      if (!v.name.trim() || !v.sku.trim()) {
        setErrorMessage('All variants must have a name and a SKU.');
        return;
      }
      const priceNum = parseFloat(v.priceDollars);
      if (isNaN(priceNum) || priceNum < 0.5) {
        setErrorMessage(`Invalid price for variant "${v.name}". Minimum price is $0.50.`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        categoryId,
        collections: selectedCollections,
        tags: tags.trim(),
        materials: materials.trim(),
        dimensions: dimensions.trim(),
        careInstructions: careInstructions.trim(),
        productionTime: productionTime.trim(),
        variationDisclaimer: variationDisclaimer.trim(),
        status: finalStatus,
        isHandmade,
        isFeatured,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        images: images.map((img, idx) => ({
          id: img.id,
          url: img.url,
          altText: img.altText || title.trim(),
          isPrimary: img.isPrimary,
          sortOrder: img.sortOrder ?? idx,
        })),
        variants: variants.map((v) => ({
          id: v.id,
          name: v.name.trim(),
          sku: v.sku.trim(),
          priceDollars: parseFloat(v.priceDollars) || 12.0,
          compareAtPriceDollars: v.compareAtPriceDollars ? parseFloat(v.compareAtPriceDollars) : null,
          stock: parseInt(v.stock, 10) || 0,
        })),
      };

      const url = isEditing && initialData?.id ? `/api/admin/products/${initialData.id}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setIsDirty(false);
      setSuccessMessage(
        isEditing
          ? `Product "${data.product.title}" saved successfully!`
          : `Product "${data.product.title}" created successfully!`
      );

      if (!isEditing) {
        router.push(`/admin/products/${data.product.id}/edit?created=1`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving the product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!initialData?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${initialData.id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to duplicate');
      router.push(`/admin/products/${data.product.id}/edit?duplicated=1`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error duplicating product');
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${initialData.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product');
      router.push('/admin/products?deleted=1');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting product');
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Top Breadcrumb & Action Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/admin/products"
            style={{
              color: 'var(--muted-foreground)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            &larr; Products
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>
            {isEditing ? `Edit: ${initialData?.title || 'Product'}` : 'New Product'}
          </span>
          {isDirty && (
            <span
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'rgba(180, 83, 9, 0.15)',
                color: 'var(--primary)',
                padding: '0.15rem 0.5rem',
                borderRadius: '10px',
                fontWeight: 600,
              }}
            >
              Unsaved changes
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/admin/products"
            onClick={(e) => {
              if (isDirty && !confirm('You have unsaved changes. Discard and return to products?')) {
                e.preventDefault();
              }
            }}
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.875rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              textDecoration: 'none',
            }}
          >
            Discard
          </Link>

          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            disabled={isLoading}
            style={{
              padding: '0.6rem 1rem',
              fontSize: '0.875rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave('ACTIVE')}
            disabled={isLoading}
            style={{
              padding: '0.6rem 1.4rem',
              fontSize: '0.875rem',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(180, 83, 9, 0.2)',
            }}
          >
            {isLoading ? 'Saving...' : status === 'ACTIVE' ? 'Save Changes' : 'Publish Product'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: 'rgba(194, 65, 12, 0.1)',
            border: '1px solid var(--accent-terracotta)',
            color: 'var(--accent-terracotta)',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            backgroundColor: 'rgba(46, 125, 50, 0.1)',
            border: '1px solid var(--accent-sage)',
            color: '#2e7d32',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* 2-Column Shopify Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* LEFT MAIN COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* 1. Title & URL Handle */}
          <div
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '1.5rem',
            }}
          >
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Product Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Diet Coke Vintage Cigarette Pack Sticker"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1.1rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                outline: 'none',
                fontFamily: 'var(--font-serif)',
              }}
            />

            {/* Handle / Slug preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
              <span>Storefront URL:</span>
              <code>dearlittlethings.studio/product/</code>
              {isEditingSlug ? (
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    markDirty();
                  }}
                  onBlur={() => setIsEditingSlug(false)}
                  style={{
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.8rem',
                    border: '1px solid var(--primary)',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                  }}
                />
              ) : (
                <span
                  onClick={() => setIsEditingSlug(true)}
                  title="Click to edit URL handle"
                  style={{
                    fontWeight: 600,
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontFamily: 'monospace',
                  }}
                >
                  {slug || 'generated-handle'}
                </span>
              )}
            </div>
          </div>

          {/* 2. Rich-Text Description */}
          <div
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '1.5rem',
            }}
          >
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Description *
            </label>
            <RichTextEditor
              value={description}
              onChange={(val) => {
                setDescription(val);
                markDirty();
              }}
              placeholder="Write poetic studio notes, paper weights, inspiration, or handcrafted details..."
            />
          </div>

          {/* 3. Media Uploads */}
          <div
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '1.5rem',
            }}
          >
            <ProductImageUploader
              images={images}
              onChange={(newImages) => {
                setImages(newImages);
                markDirty();
              }}
            />
          </div>

          {/* 4. Pricing, SKUs & Inventory Matrix */}
          <VariantManager
            hasMultipleVariants={hasMultipleVariants}
            onToggleMultipleVariants={(enabled) => {
              setHasMultipleVariants(enabled);
              markDirty();
            }}
            variants={variants}
            onChangeVariants={(newVariants) => {
              setVariants(newVariants);
              markDirty();
            }}
            baseSku={slug ? slug.toUpperCase().slice(0, 8) : 'DLT'}
          />

          {/* 5. Search Engine Optimization (SEO) */}
          <div
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
              Search Engine Listing (SEO)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', margin: '0 0 1.25rem 0' }}>
              Preview and customize how this product appears on Google and social media.
            </p>

            {/* Live Search Snippet Preview */}
            <div
              style={{
                backgroundColor: 'rgba(244, 239, 235, 0.4)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#202124' }}>
                dearlittlethings.studio &rsaquo; product &rsaquo; {slug || 'product-handle'}
              </div>
              <div style={{ fontSize: '1.1rem', color: '#1a0dab', marginTop: '0.2rem', fontWeight: 500 }}>
                {seoTitle || title || 'Product Title'} | dear little things
              </div>
              <div style={{ fontSize: '0.85rem', color: '#4d5156', marginTop: '0.25rem', lineHeight: 1.5 }}>
                {seoDescription ||
                  (description ? description.replace(/<[^>]*>/g, '').slice(0, 150) + '...' : 'Thoughtfully designed handmade studio object crafted for everyday wonder.')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  SEO Page Title
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value);
                    markDirty();
                  }}
                  placeholder={title || 'Product Title'}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  SEO Meta Description
                </label>
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => {
                    setSeoDescription(e.target.value);
                    markDirty();
                  }}
                  placeholder="Summarize product materials, charm, and craftsmanship for search engines..."
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Status Card */}
          <div
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '1.5rem',
            }}
          >
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Product Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                markDirty();
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                backgroundColor: 'var(--background)',
                fontSize: '0.9rem',
                marginBottom: '1rem',
              }}
            >
              <option value="ACTIVE">Active (Visible in storefront)</option>
              <option value="DRAFT">Draft (Hidden from customers)</option>
              <option value="ARCHIVED">Archived (Unlisted)</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => {
                  setIsFeatured(e.target.checked);
                  markDirty();
                }}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <span>Feature on homepage studio showcase</span>
            </label>
          </div>

          {/* Organization Card */}
          <div
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '1.5rem',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Organization</h4>

            {/* Category */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  markDirty();
                }}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--background)',
                  fontSize: '0.9rem',
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Collections */}
            {collections.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Collections
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {collections.map((col) => (
                    <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(col.id)}
                        onChange={() => handleCollectionToggle(col.id)}
                        style={{ width: '15px', height: '15px', accentColor: 'var(--primary)' }}
                      />
                      <span>{col.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => {
                  setTags(e.target.value);
                  markDirty();
                }}
                placeholder="stickers, cute, vintage"
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Artisanal Studio Details */}
          <div
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '1.5rem',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Studio Details</h4>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isHandmade}
                  onChange={(e) => {
                    setIsHandmade(e.target.checked);
                    markDirty();
                  }}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <span>Handmade in Studio</span>
              </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Production / Dispatch Time
              </label>
              <input
                type="text"
                value={productionTime}
                onChange={(e) => {
                  setProductionTime(e.target.value);
                  markDirty();
                }}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Materials
              </label>
              <input
                type="text"
                value={materials}
                onChange={(e) => {
                  setMaterials(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Matte laminated vinyl"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Dimensions
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => {
                  setDimensions(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. 7.5cm x 5.0cm"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Quick Actions Card (in edit mode) */}
          {isEditing && (
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <Link
                href={`/product/${slug}`}
                target="_blank"
                style={{
                  textAlign: 'center',
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--foreground)',
                  textDecoration: 'none',
                }}
              >
                View in Storefront &nearr;
              </Link>

              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isLoading}
                style={{
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'var(--foreground)',
                }}
              >
                Duplicate Product
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={isLoading}
                style={{
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--accent-terracotta)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'var(--accent-terracotta)',
                }}
              >
                Delete Product
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--background)',
              borderRadius: '6px',
              maxWidth: '440px',
              width: '100%',
              padding: '1.75rem',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>
              Delete &ldquo;{title}&rdquo;?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              Are you sure you want to permanently delete this product? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  border: 'none',
                  backgroundColor: 'var(--accent-terracotta)',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {isLoading ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
