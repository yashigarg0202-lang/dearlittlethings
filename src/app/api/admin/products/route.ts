import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const ProductImageInputSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1),
  altText: z.string().optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const VariantInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  sku: z.string().min(1),
  priceDollars: z.number().min(0.5),
  compareAtPriceDollars: z.number().optional().nullable(),
  stock: z.number().int().min(0).default(0),
});

const CreateProductSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(2),
  categoryId: z.string().min(1),
  collections: z.array(z.string()).optional(),
  tags: z.string().optional(),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  careInstructions: z.string().optional(),
  isHandmade: z.boolean().default(true),
  productionTime: z.string().optional(),
  variationDisclaimer: z.string().optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('ACTIVE'),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  // Multiple images support
  images: z.array(ProductImageInputSchema).optional(),
  // Multiple variants support
  variants: z.array(VariantInputSchema).optional(),
  // Backward compatibility with legacy single fields
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  variantName: z.string().optional(),
  sku: z.string().optional(),
  priceDollars: z.number().optional(),
  compareAtPriceDollars: z.number().optional().nullable(),
  stock: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.toUpperCase() || '';
    const categoryId = searchParams.get('categoryId') || '';
    const sort = searchParams.get('sort') || 'newest';

    const where: any = {};

    if (status && ['ACTIVE', 'DRAFT', 'ARCHIVED'].includes(status)) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sort === 'title_asc') orderBy = { title: 'asc' };
    else if (sort === 'title_desc') orderBy = { title: 'desc' };

    const [products, totalCount, activeCount, draftCount, archivedCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        include: {
          category: true,
          variants: { orderBy: { price: 'asc' } },
          images: { orderBy: { sortOrder: 'asc' } },
          collections: { include: { collection: true } },
        },
      }),
      prisma.product.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { status: 'DRAFT' } }),
      prisma.product.count({ where: { status: 'ARCHIVED' } }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      counts: {
        all: totalCount,
        active: activeCount,
        draft: draftCount,
        archived: archivedCount,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching admin products:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid product payload' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json({ error: 'A product with this slug already exists.' }, { status: 400 });
    }

    // Build variants array
    let variantsToCreate: {
      name: string;
      sku: string;
      price: number;
      compareAtPrice: number | null;
      stock: number;
      optionValues?: string;
    }[] = [];

    if (data.variants && data.variants.length > 0) {
      for (const v of data.variants) {
        const existingSku = await prisma.productVariant.findUnique({ where: { sku: v.sku } });
        if (existingSku) {
          return NextResponse.json({ error: `A variant with SKU "${v.sku}" already exists.` }, { status: 400 });
        }
        variantsToCreate.push({
          name: v.name,
          sku: v.sku,
          price: Math.round(v.priceDollars * 100),
          compareAtPrice: v.compareAtPriceDollars ? Math.round(v.compareAtPriceDollars * 100) : null,
          stock: v.stock,
          optionValues: JSON.stringify({ Option: v.name }),
        });
      }
    } else {
      const sku = data.sku || `${data.slug.toUpperCase().slice(0, 8)}-01`;
      const existingSku = await prisma.productVariant.findUnique({ where: { sku } });
      if (existingSku) {
        return NextResponse.json({ error: `A variant with SKU "${sku}" already exists.` }, { status: 400 });
      }
      const priceDollars = data.priceDollars || 12.0;
      variantsToCreate.push({
        name: data.variantName || 'Standard',
        sku,
        price: Math.round(priceDollars * 100),
        compareAtPrice: data.compareAtPriceDollars ? Math.round(data.compareAtPriceDollars * 100) : null,
        stock: data.stock !== undefined ? data.stock : 20,
        optionValues: JSON.stringify({ Option: data.variantName || 'Standard' }),
      });
    }

    // Prepare images array
    let imagesToCreate: { url: string; altText: string; sortOrder: number; isPrimary: boolean }[] = [];

    if (data.images && data.images.length > 0) {
      const hasPrimary = data.images.some((img) => img.isPrimary);
      imagesToCreate = data.images.map((img, idx) => ({
        url: img.url,
        altText: img.altText || data.title,
        sortOrder: img.sortOrder ?? idx,
        isPrimary: hasPrimary ? !!img.isPrimary : idx === 0,
      }));
    } else if (data.imageUrl) {
      imagesToCreate = [
        {
          url: data.imageUrl,
          altText: data.imageAlt || data.title,
          sortOrder: 0,
          isPrimary: true,
        },
      ];
    } else {
      imagesToCreate = [
        {
          url: '/placeholders/product-stickers-1.svg',
          altText: data.title,
          sortOrder: 0,
          isPrimary: true,
        },
      ];
    }

    const product = await prisma.product.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        tags: data.tags || null,
        materials: data.materials || null,
        dimensions: data.dimensions || null,
        careInstructions: data.careInstructions || null,
        isHandmade: data.isHandmade,
        productionTime: data.productionTime || null,
        variationDisclaimer: data.variationDisclaimer || null,
        status: data.status,
        isFeatured: data.isFeatured,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        images: {
          create: imagesToCreate,
        },
        variants: {
          create: variantsToCreate,
        },
        collections: data.collections && data.collections.length > 0
          ? {
              create: data.collections.map((colId) => ({
                collectionId: colId,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        variants: true,
        images: { orderBy: { sortOrder: 'asc' } },
        collections: { include: { collection: true } },
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'PRODUCT_CREATE',
        entityType: 'PRODUCT',
        entityId: product.id,
        details: `Created product "${product.title}" (${product.slug}) with ${imagesToCreate.length} image(s), ${variantsToCreate.length} variant(s)`,
      },
    });

    // Instant storefront revalidation
    try {
      revalidatePath('/');
      revalidatePath('/shop');
      revalidatePath(`/product/${product.slug}`);
      if (product.category?.slug) {
        revalidatePath(`/category/${product.category.slug}`);
      }
    } catch (revalErr) {
      console.warn('Revalidation warning:', revalErr);
    }

    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    const message = error instanceof Error ? error.message : 'Failed to create product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
