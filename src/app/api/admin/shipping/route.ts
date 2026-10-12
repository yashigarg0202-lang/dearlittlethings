import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const CreateRateSchema = z.object({
  zoneId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  rateDollars: z.number().min(0),
  minAmountDollars: z.number().optional(),
  estimatedDaysMin: z.number().int().optional(),
  estimatedDaysMax: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const parsed = CreateRateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid shipping rate data' }, { status: 400 });
    }

    const {
      zoneId,
      name,
      description,
      rateDollars,
      minAmountDollars,
      estimatedDaysMin,
      estimatedDaysMax,
    } = parsed.data;

    const rate = await prisma.shippingRate.create({
      data: {
        zoneId,
        name,
        description: description || null,
        rate: Math.round(rateDollars * 100),
        minAmount: minAmountDollars ? Math.round(minAmountDollars * 100) : null,
        estimatedDaysMin: estimatedDaysMin || null,
        estimatedDaysMax: estimatedDaysMax || null,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'SHIPPING_RATE_CREATE',
        entityType: 'SHIPPING_RATE',
        entityId: rate.id,
        details: `Created shipping rate "${name}" ($${rateDollars.toFixed(2)})`,
      },
    });

    return NextResponse.json({ success: true, rate });
  } catch (error: any) {
    console.error('Shipping rate creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create rate' }, { status: 500 });
  }
}
