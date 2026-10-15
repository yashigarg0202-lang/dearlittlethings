import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const [product, categories, collections] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: { orderBy: { price: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
        collections: true,
      },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.collection.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!product) {
    notFound();
  }

  const initialData: ProductFormData = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    categoryId: product.categoryId,
    collections: product.collections.map((c) => c.collectionId),
    tags: product.tags || '',
    materials: product.materials || '',
    dimensions: product.dimensions || '',
    careInstructions: product.careInstructions || '',
    productionTime: product.productionTime || '',
    variationDisclaimer: product.variationDisclaimer || '',
    status: product.status as any,
    isHandmade: product.isHandmade,
    isFeatured: product.isFeatured,
    seoTitle: product.seoTitle || '',
    seoDescription: product.seoDescription || '',
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      priceDollars: (v.price / 100).toFixed(2),
      compareAtPriceDollars: v.compareAtPrice ? (v.compareAtPrice / 100).toFixed(2) : '',
      stock: v.stock.toString(),
    })),
  };

  return (
    <div>
      <ProductForm
        initialData={initialData}
        categories={categories}
        collections={collections}
        isEditing={true}
      />
    </div>
  );
}
