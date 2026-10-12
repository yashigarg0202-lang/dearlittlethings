import React from 'react';
import prisma from '@/lib/prisma';
import AdminCategoriesClient from '@/components/AdminCategoriesClient';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const [categories, collections] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    }),
    prisma.collection.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    }),
  ]);

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: '0 0 0.25rem 0' }}>
          Categories & Collections
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
          Manage product groupings and series. Adding a new category here automatically creates its store page and navigation entry without code changes.
        </p>
      </div>

      <AdminCategoriesClient initialCategories={categories} initialCollections={collections} />
    </div>
  );
}
