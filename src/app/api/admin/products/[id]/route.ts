import { NextRequest, NextResponse } from 'next/server';
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

const UpdateProductSchema = z.object({
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
  images: z.array(ProductImageInputSchema).optional(),
  variantName: z.string().min(1),
  sku: z.string().min(1),
  priceDollars: z.number().min(0.5),
  stock: z.number().int().min(0),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: { orderBy: { price: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    console.error('Error fetching admin product:', error);
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid product payload' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true, images: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check slug collision
    if (data.slug !== existingProduct.slug) {
      const slugCollision = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (slugCollision) {
        return NextResponse.json({ error: 'Another product with this slug already exists.' }, { status: 400 });
      }
    }

    const priceCents = Math.round(data.priceDollars * 100);

    // Update product & sync images transactionally
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update basic product info
      const prod = await tx.product.update({
        where: { id },
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
        },
      });

      // 2. Sync images if provided
      if (data.images && data.images.length > 0) {
        // Delete previous images and re-insert to maintain clean ordering & primary flags
        await tx.productImage.deleteMany({
          where: { productId: id },
        });

        const hasPrimary = data.images.some((img) => img.isPrimary);
        await tx.productImage.createMany({
          data: data.images.map((img, idx) => ({
            productId: id,
            url: img.url,
            altText: img.altText || data.title,
            sortOrder: img.sortOrder ?? idx,
            isPrimary: hasPrimary ? !!img.isPrimary : idx === 0,
          })),
        });
      }

      // 3. Update primary variant or create if none exists
      if (existingProduct.variants.length > 0) {
        const firstVariant = existingProduct.variants[0];
        await tx.productVariant.update({
          where: { id: firstVariant.id },
          data: {
            name: data.variantName,
            sku: data.sku,
            price: priceCents,
            stock: data.stock,
            optionValues: JSON.stringify({ Option: data.variantName }),
          },
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId: id,
            name: data.variantName,
            sku: data.sku,
            price: priceCents,
            stock: data.stock,
            optionValues: JSON.stringify({ Option: data.variantName }),
          },
        });
      }

      return prod;
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'PRODUCT_UPDATE',
        entityType: 'PRODUCT',
        entityId: id,
        details: `Updated product "${updated.title}" (${updated.slug})`,
      },
    });

    const finalProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });

    return NextResponse.json({ success: true, product: finalProduct });
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'PRODUCT_DELETE',
        entityType: 'PRODUCT',
        entityId: id,
        details: `Deleted product "${existingProduct.title}" (${existingProduct.slug})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting product:', error);
    if (error instanceof Error && error.message.includes('Admin access required')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
