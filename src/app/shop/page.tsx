import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import { sanitizeProductImages } from '@/lib/images';
import { stripHtmlToPlainText } from '@/lib/sanitize-description';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'the collection | dear little things',
  description: 'browse all our handmade stickers, keyrings, charms, and slow-crochet goods.',
};

type ShopProduct = Prisma.ProductGetPayload<{
  include: {
    images: { orderBy: { sortOrder: 'asc' } };
    variants: { orderBy: { price: 'asc' } };
    category: true;
  };
}>;

type ShopCategory = Prisma.CategoryGetPayload<{}>;

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    collection?: string;
    sort?: string;
    q?: string;
  }>;
}

function normalizeCategory(raw?: string): string {
  if (!raw || raw.toLowerCase() === 'all') return 'all';
  const clean = raw.toLowerCase().trim();
  if (clean === 'handmade-crochet' || clean === 'handmade crochet' || clean === 'crochet') return 'crochet';
  if (clean === 'keyrings-charms' || clean === 'keyrings-and-charms' || clean === 'keyrings & charms' || clean === 'keyrings') return 'keyrings';
  if (clean === 'stickers' || clean === 'sticker') return 'stickers';
  return clean;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const normalizedCategory = normalizeCategory(params.category);
  const currentCollection = params.collection?.trim() || '';
  const query = params.q?.trim() || '';

  // Build Prisma where query
  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
  };

  if (normalizedCategory !== 'all') {
    where.category = {
      OR: [
        { slug: normalizedCategory },
        { name: { equals: normalizedCategory, mode: 'insensitive' } },
        ...(params.category ? [{ slug: params.category }] : []),
      ],
    };
  }

  if (currentCollection && currentCollection !== 'all') {
    where.collections = {
      some: {
        collection: {
          OR: [
            { slug: currentCollection },
            { name: { equals: currentCollection, mode: 'insensitive' } },
          ],
        },
      },
    };
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { contains: query, mode: 'insensitive' } },
    ];
  }

  const [products, categories]: [ShopProduct[], ShopCategory[]] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { price: 'asc' } },
        category: true,
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  const activeCategory = categories.find((c) => c.slug === normalizedCategory);

  const categoryPills = [
    { label: 'everything', slug: 'all', href: '/shop' },
    ...categories.map((c: ShopCategory) => ({
      label: c.name.toLowerCase(),
      slug: c.slug,
      href: `/shop?category=${c.slug}`,
    })),
  ];

  const sanitizedProducts = products.map((product) => ({
    ...product,
    description: stripHtmlToPlainText(product.description),
    images: sanitizeProductImages(product.images),
  }));

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '4rem 1.5rem 8rem 1.5rem' }}>
      {/* Editorial Header */}
      <div style={{ marginBottom: '3.5rem' }}>
        <p
          className="font-accent"
          style={{
            fontSize: '1.75rem',
            color: 'var(--primary)',
            margin: '0 0 0.5rem 0',
          }}
        >
          the collection
        </p>

        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(2.75rem, 5.5vw, 4.25rem)',
            lineHeight: 1.05,
            margin: '0 0 2rem 0',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--foreground)',
          }}
        >
          {activeCategory
            ? `${activeCategory.name.toLowerCase()}.`
            : currentCollection
            ? `${currentCollection.replace(/-/g, ' ')}.`
            : 'all the little things.'}
        </h1>

        {query && (
          <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
            Showing results for &ldquo;<strong>{query}</strong>&rdquo; &mdash;{' '}
            <Link href="/shop" className="link-quiet" style={{ color: 'var(--foreground)' }}>
              clear search
            </Link>
          </div>
        )}

        {currentCollection && (
          <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
            Showing curated series &ldquo;<strong>{currentCollection.replace(/-/g, ' ')}</strong>&rdquo; &mdash;{' '}
            <Link href="/shop" className="link-quiet" style={{ color: 'var(--foreground)' }}>
              clear series filter
            </Link>
          </div>
        )}

        {/* Category Pill Filters */}
        <nav
          aria-label="Category filter"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          {categoryPills.map((pill) => {
            const isActive = !currentCollection && normalizedCategory === pill.slug;
            return (
              <Link
                key={pill.slug}
                href={pill.href}
                className={isActive ? 'btn-ink' : 'pill-quiet'}
                scroll={false}
                style={{
                  fontSize: '0.875rem',
                  letterSpacing: '0.02em',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                }}
              >
                {pill.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Product Grid: 3 Columns with Staggered Editorial Rhythm */}
      {products.length === 0 ? (
        <div
          style={{
            padding: '5rem 2rem',
            textAlign: 'center',
            border: '1px dashed var(--border)',
            borderRadius: '4px',
            backgroundColor: 'rgba(244, 239, 235, 0.4)',
          }}
        >
          <h2
            className="font-display"
            style={{
              fontSize: '2rem',
              fontStyle: 'italic',
              fontWeight: 400,
              marginBottom: '0.75rem',
            }}
          >
            no little things found
          </h2>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--muted-foreground)',
              marginBottom: '2rem',
            }}
          >
            We don&apos;t have any objects in this collection right now.
          </p>
          <Link href="/shop" className="btn-ink">
            see everything
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            columnGap: '2.5rem',
            rowGap: '4.5rem',
          }}
        >
          {sanitizedProducts.map((product: ShopProduct, idx: number) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              slug={product.slug}
              description={product.description}
              images={product.images}
              variants={product.variants}
              index={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}
