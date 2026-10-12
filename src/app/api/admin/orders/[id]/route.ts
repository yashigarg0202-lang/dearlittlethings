import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const UpdateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  trackingCarrier: z.string().optional(),
  trackingNumber: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const parsed = UpdateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    const { status, trackingCarrier, trackingNumber } = parsed.data;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        trackingCarrier: trackingCarrier || null,
        trackingNumber: trackingNumber || null,
        shippedAt: status === 'SHIPPED' ? new Date() : existingOrder.shippedAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'ORDER_STATUS_UPDATE',
        entityType: 'ORDER',
        entityId: id,
        details: `Updated Order #${existingOrder.orderNumber} status to ${status}${trackingNumber ? ` with tracking ${trackingNumber}` : ''}`,
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: unknown) {
    console.error('Error updating order:', error);
    const message = error instanceof Error ? error.message : 'Failed to update order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
