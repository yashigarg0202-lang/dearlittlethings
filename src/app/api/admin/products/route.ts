import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const ProductImageInputSchema = z.object({
  url: z.string().min(1),
  altText: z.string().optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const CreateProductSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(5),
  categoryId: z.string().min(1),
  tags: z.string().optional(),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  careInstructions: z.string().optional(),
  isHandmade: z.boolean().default(true),
  productionTime: z.string().optional(),
  variationDisclaimer: z.string().optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('ACTIVE'),
  isFeatured: z.boolean().default(false),
  // Multiple images support
  images: z.array(ProductImageInputSchema).optional(),
  // Backward compatibility with legacy single image fields
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  variantName: z.string().min(1),
  sku: z.string().min(1),
  priceDollars: z.number().min(0.5),
  stock: z.number().int().min(0),
});

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

    // Check SKU uniqueness
    const existingSku = await prisma.productVariant.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      return NextResponse.json({ error: 'A variant with this SKU already exists.' }, { status: 400 });
    }

    const priceCents = Math.round(data.priceDollars * 100);

    // Prepare images array
    let imagesToCreate: { url: string; altText: string; sortOrder: number; isPrimary: boolean }[] = [];

    if (data.images && data.images.length > 0) {
      // Check if any is marked as primary
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
        images: {
          create: imagesToCreate,
        },
        variants: {
          create: [
            {
              name: data.variantName,
              sku: data.sku,
              price: priceCents,
              stock: data.stock,
              optionValues: JSON.stringify({ Option: data.variantName }),
            },
          ],
        },
      },
      include: {
        variants: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'PRODUCT_CREATE',
        entityType: 'PRODUCT',
        entityId: product.id,
        details: `Created product "${product.title}" (${product.slug}) with ${imagesToCreate.length} image(s), SKU ${data.sku} at ₹${data.priceDollars.toFixed(2)}`,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to create product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
