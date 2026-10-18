import React, { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import ProductDetailClient from '@/components/ProductDetailClient';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60;

type ProductPageItem = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: { orderBy: { sortOrder: 'asc' } };
    variants: { orderBy: { price: 'asc' } };
  };
}>;

type RelatedProduct = Prisma.ProductGetPayload<{
  include: {
    images: { orderBy: { sortOrder: 'asc' } };
    variants: { orderBy: { price: 'asc' } };
    category: true;
  };
}>;

type ShippingRateRow = Prisma.ShippingRateGetPayload<{}>;
type ProductImageRow = Prisma.ProductImageGetPayload<{}>;
type ProductVariantRow = Prisma.ProductVariantGetPayload<{}>;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Deduplicate product query across generateMetadata and ProductPage via React.cache
const getProductBySlug = cache(async (slug: string): Promise<ProductPageItem | null> => {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { price: 'asc' } },
    },
  });
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: 'Product Not Found | dear little things' };

  return {
    title: `${product.title.toLowerCase()} | dear little things`,
    description: product.seoDescription || product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.images[0]?.url ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product || product.status !== 'ACTIVE') {
    notFound();
  }

  // Fetch configured shipping rates and related products concurrently in parallel
  const [domesticZone, relatedProducts] = await Promise.all([
    prisma.shippingZone.findFirst({
      include: { rates: { where: { isActive: true }, orderBy: { rate: 'asc' } } },
    }),
    prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'ACTIVE',
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { price: 'asc' } },
        category: true,
      },
      take: 3,
    }),
  ]);

  const shippingRates = domesticZone?.rates.map((r: ShippingRateRow) => ({
    name: r.name,
    rate: r.rate,
    estimatedDaysMin: r.estimatedDaysMin,
    estimatedDaysMax: r.estimatedDaysMax,
  })) || [];

  // Schema.org structured data JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images.map((img: ProductImageRow) => img.url),
    brand: {
      '@type': 'Brand',
      name: 'dear little things',
    },
    offers: product.variants.map((variant: ProductVariantRow) => ({
      '@type': 'Offer',
      sku: variant.sku,
      price: (variant.price / 100).toFixed(2),
      priceCurrency: 'INR',
      availability: variant.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    })),
  };

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1.5rem 8rem 1.5rem' }}>
      {/* Schema.org script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Main product detail */}
      <ProductDetailClient
        product={product}
        shippingRates={shippingRates}
      />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section
          style={{
            marginTop: '7rem',
            paddingTop: '4rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ marginBottom: '3rem' }}>
            <p
              className="font-accent"
              style={{
                fontSize: '1.5rem',
                color: 'var(--primary)',
                margin: '0 0 0.5rem 0',
              }}
            >
              more little companions
            </p>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                margin: 0,
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'var(--foreground)',
              }}
            >
              you might also love.
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              columnGap: '2.5rem',
              rowGap: '4rem',
            }}
          >
            {relatedProducts.map((p: RelatedProduct, idx: number) => (
              <ProductCard
                key={p.id}
                id={p.id}
                title={p.title}
                slug={p.slug}
                description={p.description}
                images={p.images}
                variants={p.variants}
                index={idx}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
