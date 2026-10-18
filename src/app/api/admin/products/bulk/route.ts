import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin, AuthError } from '@/lib/auth';

const BulkActionSchema = z.object({
  ids: z.array(z.string()).min(1, 'Please select at least one product.'),
  action: z.enum(['PUBLISH', 'DRAFT', 'ARCHIVE', 'DELETE']),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const parsed = BulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid payload' }, { status: 400 });
    }

    const { ids, action } = parsed.data;

    let updatedCount = 0;

    if (action === 'PUBLISH') {
      const res = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status: 'ACTIVE' },
      });
      updatedCount = res.count;
    } else if (action === 'DRAFT') {
      const res = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status: 'DRAFT' },
      });
      updatedCount = res.count;
    } else if (action === 'ARCHIVE') {
      const res = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status: 'ARCHIVED' },
      });
      updatedCount = res.count;
    } else if (action === 'DELETE') {
      const res = await prisma.product.deleteMany({
        where: { id: { in: ids } },
      });
      updatedCount = res.count;
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: `PRODUCT_BULK_${action}`,
        entityType: 'PRODUCT',
        details: `Bulk ${action} executed on ${updatedCount} products`,
      },
    });

    try {
      revalidatePath('/');
      revalidatePath('/shop');
    } catch {}

    return NextResponse.json({
      success: true,
      action,
      count: updatedCount,
      message: `Successfully executed ${action.toLowerCase()} on ${updatedCount} product(s).`,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError || (error as any)?.status === 401 || (error as any)?.status === 403) {
      const status = (error as any).status || 401;
      return NextResponse.json({ error: (error as Error).message }, { status });
    }
    console.error('Error executing bulk action:', error);
    const message = error instanceof Error ? error.message : 'Bulk action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
