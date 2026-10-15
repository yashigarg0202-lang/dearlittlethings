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

const UpdateProductSchema = z.object({
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
  images: z.array(ProductImageInputSchema).optional(),
  variants: z.array(VariantInputSchema).optional(),
  // Legacy single fields
  variantName: z.string().optional(),
  sku: z.string().optional(),
  priceDollars: z.number().optional(),
  compareAtPriceDollars: z.number().optional().nullable(),
  stock: z.number().optional(),
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
        collections: { include: { collection: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    console.error('Error fetching admin product:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch product';
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
      include: { variants: true, images: true, category: true },
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

    // Update product & sync relations transactionally
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
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
        },
      });

      // 2. Sync images if provided
      if (data.images && data.images.length > 0) {
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

      // 3. Sync Collections
      if (data.collections !== undefined) {
        await tx.productCollection.deleteMany({
          where: { productId: id },
        });

        if (data.collections.length > 0) {
          await tx.productCollection.createMany({
            data: data.collections.map((colId) => ({
              productId: id,
              collectionId: colId,
            })),
          });
        }
      }

      // 4. Sync Variants
      if (data.variants && data.variants.length > 0) {
        // Collect existing variant IDs to preserve relations where possible
        const incomingIds = new Set(data.variants.map((v) => v.id).filter(Boolean));

        // Delete variants not in incoming list (if not referenced by order items)
        for (const ev of existingProduct.variants) {
          if (!incomingIds.has(ev.id)) {
            try {
              await tx.productVariant.delete({ where: { id: ev.id } });
            } catch {
              // If variant has order item relations, preserve but set stock to 0
              await tx.productVariant.update({ where: { id: ev.id }, data: { stock: 0 } });
            }
          }
        }

        // Upsert incoming variants
        for (const v of data.variants) {
          const priceCents = Math.round(v.priceDollars * 100);
          const comparePriceCents = v.compareAtPriceDollars ? Math.round(v.compareAtPriceDollars * 100) : null;

          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                sku: v.sku,
                price: priceCents,
                compareAtPrice: comparePriceCents,
                stock: v.stock,
                optionValues: JSON.stringify({ Option: v.name }),
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                name: v.name,
                sku: v.sku,
                price: priceCents,
                compareAtPrice: comparePriceCents,
                stock: v.stock,
                optionValues: JSON.stringify({ Option: v.name }),
              },
            });
          }
        }
      } else if (data.variantName && data.sku && data.priceDollars !== undefined) {
        const priceCents = Math.round(data.priceDollars * 100);
        const comparePriceCents = data.compareAtPriceDollars ? Math.round(data.compareAtPriceDollars * 100) : null;

        if (existingProduct.variants.length > 0) {
          const firstVariant = existingProduct.variants[0];
          await tx.productVariant.update({
            where: { id: firstVariant.id },
            data: {
              name: data.variantName,
              sku: data.sku,
              price: priceCents,
              compareAtPrice: comparePriceCents,
              stock: data.stock !== undefined ? data.stock : firstVariant.stock,
              optionValues: JSON.stringify({ Option: data.variantName }),
            },
          });
        }
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

    // Instant storefront revalidation
    try {
      revalidatePath('/');
      revalidatePath('/shop');
      revalidatePath(`/product/${updated.slug}`);
      if (existingProduct.slug !== updated.slug) {
        revalidatePath(`/product/${existingProduct.slug}`);
      }
      if (existingProduct.category?.slug) {
        revalidatePath(`/category/${existingProduct.category.slug}`);
      }
    } catch (revalErr) {
      console.warn('Revalidation warning:', revalErr);
    }

    const finalProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { price: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        collections: { include: { collection: true } },
      },
    });

    return NextResponse.json({ success: true, product: finalProduct });
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    const message = error instanceof Error ? error.message : 'Failed to update product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
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

    // Revalidate storefront cache
    try {
      revalidatePath('/');
      revalidatePath('/shop');
      revalidatePath(`/product/${existingProduct.slug}`);
      if (existingProduct.category?.slug) {
        revalidatePath(`/category/${existingProduct.category.slug}`);
      }
    } catch (revalErr) {
      console.warn('Revalidation warning:', revalErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting product:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
