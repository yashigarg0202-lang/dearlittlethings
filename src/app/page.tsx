import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import { sanitizeProductImages } from '@/lib/images';
import { stripHtmlToPlainText } from '@/lib/sanitize-description';

export const revalidate = 60;

type HomeProduct = Prisma.ProductGetPayload<{
  include: {
    images: true;
    variants: true;
    category: true;
  };
}>;

export default async function HomePage() {
  // Fetch active products with images and variants from database
  let products: HomeProduct[] = [];
  try {
    products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { price: 'asc' } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
  } catch (err) {
    console.error('Error fetching home products:', err);
  }

  const sanitizedProducts = products.map((product) => ({
    ...product,
    description: stripHtmlToPlainText(product.description),
    images: sanitizeProductImages(product.images),
  }));

  return (
    <div>
      {/* 1. Hero Section matching dearlittlethings.lovable.app */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <Image
          src="/assets/hero.jpg"
          alt="Handmade crochet strawberry keyring with illustrated stickers on ivory paper"
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: 'cover',
            zIndex: 1,
          }}
        />

        {/* Soft overlay gradient for text legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(250, 247, 242, 0.95) 0%, rgba(250, 247, 242, 0.4) 40%, rgba(250, 247, 242, 0) 100%)',
            zIndex: 2,
          }}
        />

        {/* Content Box */}
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            maxWidth: '80rem',
            margin: '0 auto',
            width: '100%',
            padding: '0 1.5rem 5rem 1.5rem',
            boxSizing: 'border-box',
          }}
        >
          <p
            className="font-accent"
            style={{
              fontSize: '1.75rem',
              color: 'var(--primary)',
              margin: '0 0 0.5rem 0',
            }}
          >
            hello, dear —
          </p>

          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2.75rem, 6vw, 4.75rem)',
              lineHeight: 1.05,
              maxWidth: '38rem',
              margin: '0 0 2rem 0',
              fontWeight: 400,
              color: 'var(--foreground)',
            }}
          >
            small things that make everything a little <em>more beautiful.</em>
          </h1>

          <div>
            <Link href="/shop" className="btn-ink">
              browse the collection
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Collection Category Teasers in Border Grid */}
      <section
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '6rem 1.5rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            backgroundColor: 'var(--border)',
            gap: '1px',
            border: '1px solid var(--border)',
          }}
        >
          {/* Card 1: Stickers */}
          <Link
            href="/shop?category=stickers"
            className="group"
            style={{
              backgroundColor: 'var(--background)',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background-color 0.2s ease',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                color: 'var(--muted-foreground)',
              }}
            >
              01
            </span>
            <h2
              className="font-display"
              style={{
                marginTop: '1.5rem',
                fontSize: '2.25rem',
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--foreground)',
              }}
            >
              stickers
            </h2>
            <p
              style={{
                marginTop: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
              }}
            >
              for laptops, journals &amp; water bottles
            </p>
            <span
              style={{
                marginTop: '2rem',
                fontSize: '0.875rem',
                color: 'var(--foreground)',
              }}
            >
              explore →
            </span>
          </Link>

          {/* Card 2: Keyrings & Charms */}
          <Link
            href="/shop?category=keyrings"
            className="group"
            style={{
              backgroundColor: 'var(--background)',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background-color 0.2s ease',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                color: 'var(--muted-foreground)',
              }}
            >
              02
            </span>
            <h2
              className="font-display"
              style={{
                marginTop: '1.5rem',
                fontSize: '2.25rem',
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--foreground)',
              }}
            >
              keyrings &amp; charms
            </h2>
            <p
              style={{
                marginTop: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
              }}
            >
              tiny companions for every day
            </p>
            <span
              style={{
                marginTop: '2rem',
                fontSize: '0.875rem',
                color: 'var(--foreground)',
              }}
            >
              explore →
            </span>
          </Link>

          {/* Card 3: Crochet */}
          <Link
            href="/shop?category=crochet"
            className="group"
            style={{
              backgroundColor: 'var(--background)',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background-color 0.2s ease',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                color: 'var(--muted-foreground)',
              }}
            >
              03
            </span>
            <h2
              className="font-display"
              style={{
                marginTop: '1.5rem',
                fontSize: '2.25rem',
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--foreground)',
              }}
            >
              crochet
            </h2>
            <p
              style={{
                marginTop: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
              }}
            >
              stitched slowly, one loop at a time
            </p>
            <span
              style={{
                marginTop: '2rem',
                fontSize: '0.875rem',
                color: 'var(--foreground)',
              }}
            >
              explore →
            </span>
          </Link>
        </div>
      </section>

      {/* 3. Fresh from the Studio — Featured Products Section */}
      <section
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: '3.5rem',
          }}
        >
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              margin: 0,
              fontWeight: 400,
            }}
          >
            fresh from <em>the studio</em>
          </h2>
          <Link href="/shop" className="link-quiet" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
            see everything
          </Link>
        </div>

        {/* Product Grid matching reference staggered rhythm */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            columnGap: '2rem',
            rowGap: '4rem',
          }}
        >
          {sanitizedProducts.map((product: HomeProduct, idx: number) => (
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
      </section>

      {/* 4. Maker's Note Section */}
      <section
        style={{
          maxWidth: '48rem',
          margin: '8rem auto 0 auto',
          padding: '0 1.5rem',
          textAlign: 'center',
        }}
      >
        <p
          className="font-accent"
          style={{
            fontSize: '1.75rem',
            color: 'var(--primary)',
            margin: '0 0 1rem 0',
          }}
        >
          a note from the maker
        </p>

        <p
          className="font-display"
          style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
            lineHeight: 1.35,
            color: 'var(--foreground)',
            margin: '0 0 1.5rem 0',
          }}
        >
          Everything here is made in small batches, with care for the tiny details — the kind of little object you keep, gift, or carry around for years.
        </p>

        <Link
          href="/about"
          className="link-quiet"
          style={{
            fontSize: '0.875rem',
            color: 'var(--muted-foreground)',
          }}
        >
          read our story →
        </Link>
      </section>
    </div>
  );
}
