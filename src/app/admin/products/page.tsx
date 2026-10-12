import React from 'react';
import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type AdminProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    variants: { orderBy: { price: 'asc' } };
    images: { orderBy: { sortOrder: 'asc' } };
  };
}>;

export default async function AdminProductsPage() {
  const products: AdminProductWithRelations[] = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      variants: { orderBy: { price: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } },
    },
  });

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: '1px solid var(--border-hairline)',
          paddingBottom: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: 0 }}>
            Studio Products ({products.length})
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Manage titles, variants, handmade flags, prices, and publication statuses.
          </p>
        </div>

        <Link href="/admin/products/new" className="btn-primary" style={{ fontSize: '0.9rem' }}>
          + Add New Product
        </Link>
      </div>

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
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Price Range</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Total Stock</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Handmade</th>
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: AdminProductWithRelations) => {
              const minPrice = p.variants[0]?.price || 0;
              const maxPrice = p.variants[p.variants.length - 1]?.price || minPrice;
              const totalStock = p.variants.reduce((sum: number, v: { stock: number }) => sum + v.stock, 0);

              return (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-primary)',
                  }}
                >
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <strong>{p.title}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      slug: <code>{p.slug}</code>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>{p.category.name}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span
                      style={{
                        padding: '0.15rem 0.45rem',
                        backgroundColor: p.status === 'ACTIVE' ? 'var(--accent-sage-light)' : 'var(--bg-tag)',
                        color: p.status === 'ACTIVE' ? 'var(--accent-sage)' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    ${(minPrice / 100).toFixed(2)}
                    {maxPrice > minPrice && ` – $${(maxPrice / 100).toFixed(2)}`}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ fontWeight: totalStock <= 5 ? 600 : 400, color: totalStock <= 5 ? 'var(--accent-terracotta)' : 'inherit' }}>
                      {totalStock} units
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {p.isHandmade ? 'Yes' : 'No'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <Link
                      href={`/product/${p.slug}`}
                      target="_blank"
                      style={{ fontSize: '0.85rem', color: 'var(--accent-terracotta)', marginRight: '1rem', textDecoration: 'underline' }}
                    >
                      View Live
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
