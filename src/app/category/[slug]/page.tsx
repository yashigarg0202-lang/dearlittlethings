import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import ProductCard from '@/components/ProductCard';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: 'Category Not Found' };
  return {
    title: `${category.name} | Studio Catalogue`,
    description: category.introText || `Handmade ${category.name} crafted by Mio Studio.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { sort = 'newest' } = await searchParams;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { status: 'ACTIVE' },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { orderBy: { price: 'asc' } },
        },
        orderBy:
          sort === 'title-asc'
            ? { title: 'asc' }
            : sort === 'oldest'
            ? { createdAt: 'asc' }
            : { createdAt: 'desc' },
      },
    },
  });

  if (!category) {
    notFound();
  }

  // Sort prices if requested
  const products = [...category.products];
  if (sort === 'price-asc') {
    products.sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0));
  } else if (sort === 'price-desc') {
    products.sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0));
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Category Hero / Editorial Banner */}
      <div
        style={{
          borderBottom: '1px solid var(--border-hairline)',
          paddingBottom: '3rem',
          marginBottom: '3rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center',
        }}
      >
        <div style={{ maxWidth: '580px' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
            <Link href="/shop" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Studio Goods
            </Link>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-terracotta)' }}>{category.name}</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', margin: '0 0 1rem 0' }}>
            {category.name}
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
            {category.introText ||
              'Small objects carefully developed by hand in our studio workshop using tactile, enduring materials.'}
          </p>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {products.length} {products.length === 1 ? 'object available' : 'objects available in this collection'}
          </div>
        </div>

        {/* Editorial Still Life Image */}
        {category.editorialImage && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '240px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              overflow: 'hidden',
            }}
          >
            <Image
              src={category.editorialImage}
              alt={`${category.name} studio editorial visual`}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}
      </div>

      {/* Sorting bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
        }}
      >
        <span>Displaying all {category.name}</span>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sort:</span>
          <Link
            href={`/category/${slug}?sort=newest`}
            style={{ fontWeight: sort === 'newest' ? 600 : 400, color: sort === 'newest' ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            Newest
          </Link>
          <Link
            href={`/category/${slug}?sort=price-asc`}
            style={{ fontWeight: sort === 'price-asc' ? 600 : 400, color: sort === 'price-asc' ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            Price: Low
          </Link>
          <Link
            href={`/category/${slug}?sort=price-desc`}
            style={{ fontWeight: sort === 'price-desc' ? 600 : 400, color: sort === 'price-desc' ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            Price: High
          </Link>
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-hairline)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            No objects currently in this category
          </p>
          <Link href="/shop" className="btn-primary">
            Return to All Goods
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '2.5rem 2rem',
          }}
        >
          {products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              title={p.title}
              slug={p.slug}
              categoryName={category.name}
              isHandmade={p.isHandmade}
              productionTime={p.productionTime}
              images={p.images}
              variants={p.variants}
            />
          ))}
        </div>
      )}
    </div>
  );
}
