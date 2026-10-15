'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface AdminProductRow {
  id: string;
  title: string;
  slug: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | string;
  isHandmade: boolean;
  isFeatured: boolean;
  tags?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  category: { id: string; name: string; slug: string };
  images: { id: string; url: string; altText: string; isPrimary: boolean }[];
  variants: {
    id: string;
    name: string;
    sku: string;
    price: number;
    compareAtPrice?: number | null;
    stock: number;
  }[];
}

interface AdminProductsClientProps {
  initialProducts: AdminProductRow[];
  categories: { id: string; name: string }[];
}

export default function AdminProductsClient({
  initialProducts,
  categories,
}: AdminProductsClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProductRow[]>(initialProducts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter states
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortOption, setSortOption] = useState<string>('newest');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [productToDelete, setProductToDelete] = useState<AdminProductRow | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Status counts
  const counts = useMemo(() => {
    return {
      all: products.length,
      active: products.filter((p) => p.status === 'ACTIVE').length,
      draft: products.filter((p) => p.status === 'DRAFT').length,
      archived: products.filter((p) => p.status === 'ARCHIVED').length,
    };
  }, [products]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Status filter
    if (statusTab !== 'ALL') {
      result = result.filter((p) => p.status === statusTab);
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter((p) => p.category.id === categoryFilter);
    }

    // Search query (title, slug, SKU, tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.tags && p.tags.toLowerCase().includes(q)) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortOption === 'title_asc') return a.title.localeCompare(b.title);
      if (sortOption === 'title_desc') return b.title.localeCompare(a.title);
      if (sortOption === 'price_asc') {
        const minA = a.variants[0]?.price || 0;
        const minB = b.variants[0]?.price || 0;
        return minA - minB;
      }
      if (sortOption === 'price_desc') {
        const maxA = a.variants[a.variants.length - 1]?.price || 0;
        const maxB = b.variants[b.variants.length - 1]?.price || 0;
        return maxB - maxA;
      }
      if (sortOption === 'stock_asc') {
        const stockA = a.variants.reduce((sum, v) => sum + v.stock, 0);
        const stockB = b.variants.reduce((sum, v) => sum + v.stock, 0);
        return stockA - stockB;
      }
      if (sortOption === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [products, statusTab, categoryFilter, searchQuery, sortOption]);

  // Checkbox management
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  // Actions
  const handleDuplicate = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to duplicate product');
      showToast(`Duplicated into draft: "${data.product.title}"`);
      setProducts([data.product, ...products]);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Error duplicating product', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: 'ACTIVE' | 'DRAFT' | 'ARCHIVED') => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...products.find((p) => p.id === id),
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setProducts(products.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      showToast(`Status updated to ${newStatus}`);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product');

      setProducts(products.filter((p) => p.id !== productToDelete.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(productToDelete.id);
        return next;
      });
      showToast(`Deleted product "${productToDelete.title}"`);
      setProductToDelete(null);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Error deleting product', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = async (action: 'PUBLISH' | 'DRAFT' | 'ARCHIVE' | 'DELETE') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk action failed');

      if (action === 'DELETE') {
        setProducts(products.filter((p) => !selectedIds.has(p.id)));
      } else {
        const mappedStatus = action === 'PUBLISH' ? 'ACTIVE' : action === 'DRAFT' ? 'DRAFT' : 'ARCHIVED';
        setProducts(products.map((p) => (selectedIds.has(p.id) ? { ...p, status: mappedStatus } : p)));
      }

      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      showToast(data.message || `Bulk ${action.toLowerCase()} complete!`);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Error performing bulk action', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            backgroundColor: toastMessage.type === 'error' ? 'var(--accent-terracotta)' : 'var(--accent-sage)',
            color: '#fff',
            padding: '0.85rem 1.5rem',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: '1px solid var(--border-hairline)',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: 0 }}>
            Products
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Manage and publish your handmade studio goods, variants, inventory, and photography.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="btn-primary"
          style={{
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          <span>+</span> Add Product
        </Link>
      </div>

      {/* Shopify-style Status Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '1rem',
          overflowX: 'auto',
        }}
      >
        {(
          [
            { key: 'ALL', label: 'All', count: counts.all },
            { key: 'ACTIVE', label: 'Active', count: counts.active },
            { key: 'DRAFT', label: 'Draft', count: counts.draft },
            { key: 'ARCHIVED', label: 'Archived', count: counts.archived },
          ] as const
        ).map((tab) => {
          const isActive = statusTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusTab(tab.key);
                setSelectedIds(new Set());
              }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                padding: '0.6rem 1rem',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'rgba(180, 83, 9, 0.15)' : 'var(--bg-secondary)',
                  color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search, Filter & Bulk Actions Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          backgroundColor: selectedIds.size > 0 ? 'rgba(180, 83, 9, 0.06)' : 'var(--card)',
          border: selectedIds.size > 0 ? '1px solid var(--primary)' : '1px solid var(--border)',
          borderRadius: '4px',
          padding: '0.75rem 1rem',
          transition: 'all 0.2s ease',
        }}
      >
        {selectedIds.size > 0 ? (
          // Bulk Actions Toolbar
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
              {selectedIds.size} of {filteredProducts.length} selected
            </span>

            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleBulkAction('PUBLISH')}
                disabled={isLoading}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.75rem',
                  backgroundColor: 'var(--accent-sage)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Set Active
              </button>

              <button
                type="button"
                onClick={() => handleBulkAction('DRAFT')}
                disabled={isLoading}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                Set as Draft
              </button>

              <button
                type="button"
                onClick={() => handleBulkAction('ARCHIVE')}
                disabled={isLoading}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                Archive
              </button>

              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={isLoading}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.75rem',
                  backgroundColor: 'transparent',
                  color: 'var(--accent-terracotta)',
                  border: '1px solid var(--accent-terracotta)',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                Delete Selected
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.5rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // Standard Search & Filters
          <>
            <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px', alignItems: 'center' }}>
              {/* Search input */}
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>
                  &#128269;
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter products by title, SKU, or tags..."
                  style={{
                    width: '100%',
                    padding: '0.5rem 2rem 0.5rem 2.2rem',
                    fontSize: '0.875rem',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--background)',
                    outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '0.6rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted-foreground)',
                      cursor: 'pointer',
                    }}
                  >
                    &times;
                  </button>
                )}
              </div>

              {/* Category dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                }}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Sort by:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                }}
              >
                <option value="newest">Date Created: Newest</option>
                <option value="oldest">Date Created: Oldest</option>
                <option value="title_asc">Title: A &rarr; Z</option>
                <option value="title_desc">Title: Z &rarr; A</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="stock_asc">Inventory: Low to High</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Products Table */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(244, 239, 235, 0.4)' }}>
              <th style={{ padding: '0.75rem 1rem', width: '36px' }}>
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Product</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Inventory</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Price</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--muted-foreground)' }}>
                  <p style={{ fontSize: '1.05rem', margin: '0 0 0.5rem 0' }}>No products found</p>
                  <p style={{ fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>
                    {searchQuery || categoryFilter || statusTab !== 'ALL'
                      ? 'Try clearing filters or search criteria.'
                      : 'Get started by creating your first studio product.'}
                  </p>
                  <Link
                    href="/admin/products/new"
                    style={{
                      display: 'inline-block',
                      padding: '0.5rem 1.25rem',
                      backgroundColor: 'var(--primary)',
                      color: '#fff',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    + Add Product
                  </Link>
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = selectedIds.has(p.id);
                const minPrice = p.variants[0]?.price || 0;
                const maxPrice = p.variants[p.variants.length - 1]?.price || minPrice;
                const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                const hasSale = p.variants.some((v) => v.compareAtPrice && v.compareAtPrice > v.price);
                const primaryImg = p.images.find((img) => img.isPrimary) || p.images[0];

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: isSelected ? 'rgba(180, 83, 9, 0.04)' : 'transparent',
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(p.id, e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                    </td>

                    {/* Thumbnail & Title */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            backgroundColor: 'var(--bg-secondary)',
                            flexShrink: 0,
                            border: '1px solid var(--border)',
                            position: 'relative',
                          }}
                        >
                          {primaryImg?.url ? (
                            <img
                              src={primaryImg.url}
                              alt={p.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              &#128444;
                            </span>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            style={{
                              fontWeight: 600,
                              color: 'var(--foreground)',
                              textDecoration: 'none',
                            }}
                          >
                            {p.title}
                          </Link>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>
                            <span>SKU: {p.variants[0]?.sku || 'None'}</span>
                            {p.variants.length > 1 && (
                              <span style={{ marginLeft: '0.5rem', color: 'var(--primary)' }}>
                                ({p.variants.length} variants)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted-foreground)' }}>
                      {p.category.name}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor:
                            p.status === 'ACTIVE'
                              ? 'rgba(46, 125, 50, 0.12)'
                              : p.status === 'DRAFT'
                              ? 'rgba(180, 83, 9, 0.12)'
                              : 'rgba(120, 113, 108, 0.15)',
                          color:
                            p.status === 'ACTIVE'
                              ? '#2e7d32'
                              : p.status === 'DRAFT'
                              ? '#b45309'
                              : '#57534e',
                        }}
                      >
                        {p.status}
                      </span>
                    </td>

                    {/* Inventory */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          fontWeight: totalStock <= 5 ? 600 : 400,
                          color: totalStock <= 5 ? 'var(--accent-terracotta)' : 'inherit',
                        }}
                      >
                        {totalStock} in stock
                      </span>
                      {totalStock <= 5 && totalStock > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-terracotta)' }}>Low stock</div>
                      )}
                      {totalStock === 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-terracotta)' }}>Out of stock</div>
                      )}
                    </td>

                    {/* Price */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span>
                          ${(minPrice / 100).toFixed(2)}
                          {maxPrice > minPrice && ` – $${(maxPrice / 100).toFixed(2)}`}
                        </span>
                        {hasSale && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-terracotta)', fontWeight: 600 }}>
                            SALE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quick Actions */}
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--primary)',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(p.id)}
                          title="Duplicate product"
                          style={{
                            fontSize: '0.8rem',
                            background: 'none',
                            border: 'none',
                            color: 'var(--muted-foreground)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Duplicate
                        </button>

                        {p.status !== 'ARCHIVED' ? (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(p.id, 'ARCHIVED')}
                            title="Archive product"
                            style={{
                              fontSize: '0.8rem',
                              background: 'none',
                              border: 'none',
                              color: 'var(--muted-foreground)',
                              cursor: 'pointer',
                            }}
                          >
                            Archive
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(p.id, 'ACTIVE')}
                            title="Restore product to Active"
                            style={{
                              fontSize: '0.8rem',
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent-sage)',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Unarchive
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setProductToDelete(p)}
                          title="Delete product"
                          style={{
                            fontSize: '0.8rem',
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-terracotta)',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>

                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          title="View on public storefront"
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--muted-foreground)',
                            textDecoration: 'none',
                          }}
                        >
                          &nearr;
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Single Delete Confirmation Modal */}
      {productToDelete && (
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
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>
              Delete &ldquo;{productToDelete.title}&rdquo;?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              Are you sure you want to permanently delete this product? This action removes its images and variants from your store. It cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
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
                onClick={handleDeleteConfirm}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  border: 'none',
                  backgroundColor: 'var(--accent-terracotta)',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {isLoading ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
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
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>
              Delete {selectedIds.size} Selected Products?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              Are you sure you want to permanently delete these {selectedIds.size} products? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
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
                onClick={() => handleBulkAction('DELETE')}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  border: 'none',
                  backgroundColor: 'var(--accent-terracotta)',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {isLoading ? 'Deleting...' : `Delete ${selectedIds.size} Products`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
