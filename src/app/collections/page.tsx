import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Studio Collections | dear little things',
  description: 'Curated thematic groupings of handmade goods from dear little things.',
};

type CollectionWithProducts = Prisma.CollectionGetPayload<{
  include: {
    products: {
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } };
            variants: { orderBy: { price: 'asc' } };
          };
        };
      };
    };
  };
}>;

export default async function CollectionsPage() {
  const collections: CollectionWithProducts[] = await prisma.collection.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      products: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { orderBy: { price: 'asc' } },
            },
          },
        },
      },
    },
  });

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '2rem', marginBottom: '3rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-accent)',
            fontSize: '1.2rem',
            color: 'var(--accent-terracotta)',
            display: 'block',
          }}
        >
          Studio Explorations
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.75rem', margin: 0 }}>
          Curated Series & Themes
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '640px' }}>
          Objects grouped by color palette, tactile material exploration, and seasonal studio rhythms.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        {collections.map((col: CollectionWithProducts, index: number) => (
          <article
            key={col.id}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              padding: '2.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2.5rem',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-accent)',
                  color: 'var(--accent-terracotta)',
                  fontSize: '1.1rem',
                  display: 'block',
                  marginBottom: '0.25rem',
                }}
              >
                Series No. 0{index + 1}
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: '0 0 1rem 0' }}>
                {col.name}
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                {col.description}
              </p>
              <Link
                href={`/shop?collection=${col.slug}`}
                className="btn-primary"
                style={{ fontSize: '0.9rem' }}
              >
                Browse Objects in this Series ({col.products.length})
              </Link>
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '280px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-hairline)',
                overflow: 'hidden',
              }}
            >
              <Image
                src={col.image || '/placeholders/morning-sun.svg'}
                alt={col.name}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
