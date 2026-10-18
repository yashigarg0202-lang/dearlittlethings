import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAdmin, AuthError } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const source = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { price: 'asc' } },
        collections: true,
      },
    });

    if (!source) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const timestamp = Date.now().toString().slice(-4);
    const newTitle = `${source.title} (Copy)`;
    const newSlug = `${source.slug}-copy-${timestamp}`;

    const duplicated = await prisma.product.create({
      data: {
        title: newTitle,
        slug: newSlug,
        description: source.description,
        categoryId: source.categoryId,
        tags: source.tags,
        materials: source.materials,
        dimensions: source.dimensions,
        careInstructions: source.careInstructions,
        isHandmade: source.isHandmade,
        productionTime: source.productionTime,
        variationDisclaimer: source.variationDisclaimer,
        status: 'DRAFT', // Duplicates start as Draft
        isFeatured: false,
        seoTitle: source.seoTitle ? `${source.seoTitle} (Copy)` : null,
        seoDescription: source.seoDescription,
        images: {
          create: source.images.map((img) => ({
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          })),
        },
        variants: {
          create: source.variants.map((v, idx) => ({
            name: v.name,
            sku: `${v.sku}-COPY-${timestamp}${idx > 0 ? `-${idx}` : ''}`,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: v.stock,
            weight: v.weight,
            optionValues: v.optionValues,
          })),
        },
        collections: {
          create: source.collections.map((c) => ({
            collectionId: c.collectionId,
          })),
        },
      },
      include: {
        variants: true,
        images: true,
        category: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'PRODUCT_DUPLICATE',
        entityType: 'PRODUCT',
        entityId: duplicated.id,
        details: `Duplicated "${source.title}" into draft "${duplicated.title}" (${duplicated.slug})`,
      },
    });

    try {
      revalidatePath('/shop');
    } catch {}

    return NextResponse.json({ success: true, product: duplicated });
  } catch (error: unknown) {
    if (error instanceof AuthError || (error as any)?.status === 401 || (error as any)?.status === 403) {
      const status = (error as any).status || 401;
      return NextResponse.json({ error: (error as Error).message }, { status });
    }
    console.error('Error duplicating product:', error);
    const message = error instanceof Error ? error.message : 'Failed to duplicate product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
