import React from 'react';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import AdminProductsClient, { AdminProductRow } from './AdminProductsClient';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        variants: { orderBy: { price: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const serializedProducts: AdminProductRow[] = products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    isHandmade: p.isHandmade,
    isFeatured: p.isFeatured,
    tags: p.tags,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    category: {
      id: p.category.id,
      name: p.category.name,
      slug: p.category.slug,
    },
    images: p.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
    })),
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
    })),
  }));

  return (
    <AdminProductsClient
      initialProducts={serializedProducts}
      categories={categories}
    />
  );
}
