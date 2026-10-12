import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'the collection | dear little things',
  description: 'browse all our handmade stickers, keyrings, charms, and slow-crochet goods.',
};

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    q?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const currentCategory = params.category || 'all';
  const query = params.q?.trim() || '';

  // Build Prisma where query
  const where: any = {
    status: 'ACTIVE',
  };

  if (currentCategory && currentCategory !== 'all') {
    where.category = { slug: currentCategory };
  }

  if (query) {
    where.OR = [
      { title: { contains: query } },
      { description: { contains: query } },
      { tags: { contains: query } },
    ];
  }

  const [products, categories] = await Promise.all([
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

  const categoryPills = [
    { label: 'everything', slug: 'all', href: '/shop' },
    ...categories.map((c) => ({
      label: c.name.toLowerCase(),
      slug: c.slug,
      href: `/shop?category=${c.slug}`,
    })),
  ];

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
          all the little things.
        </h1>

        {query && (
          <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
            Showing results for &ldquo;<strong>{query}</strong>&rdquo; &mdash;{' '}
            <Link href="/shop" className="link-quiet" style={{ color: 'var(--foreground)' }}>
              clear search
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
            const isActive = currentCategory === pill.slug;
            return (
              <Link
                key={pill.slug}
                href={pill.href}
                className={isActive ? 'btn-ink' : 'pill-quiet'}
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
          {products.map((product, idx) => (
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
