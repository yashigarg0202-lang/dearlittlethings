import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const StockUpdateSchema = z.object({
  variantId: z.string().min(1),
  stock: z.number().int().min(0),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const parsed = StockUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid stock data' }, { status: 400 });
    }

    const { variantId, stock } = parsed.data;

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock },
      include: { product: true },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'INVENTORY_UPDATE',
        entityType: 'PRODUCT_VARIANT',
        entityId: variantId,
        details: `Updated stock of "${variant.product.title}" (${variant.name}, SKU ${variant.sku}) to ${stock}`,
      },
    });

    return NextResponse.json({ success: true, variant });
  } catch (error: unknown) {
    console.error('Inventory update error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update stock';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
