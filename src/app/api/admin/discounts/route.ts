import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const CreateDiscountSchema = z.object({
  code: z.string().min(2),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
  value: z.number().min(1),
  minSpendDollars: z.number().optional(),
  maxUses: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const parsed = CreateDiscountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid discount payload' }, { status: 400 });
    }

    const { code, description, discountType, value, minSpendDollars, maxUses } = parsed.data;

    const existing = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'This coupon code already exists.' }, { status: 400 });
    }

    const discount = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        description: description || null,
        discountType,
        value: discountType === 'PERCENTAGE' ? value : Math.round(value * 100),
        minSpend: minSpendDollars ? Math.round(minSpendDollars * 100) : null,
        maxUses: maxUses || null,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: 'DISCOUNT_CREATE',
        entityType: 'DISCOUNT',
        entityId: discount.id,
        details: `Created discount code "${code.toUpperCase()}" (${discountType}, value ${value})`,
      },
    });

    return NextResponse.json({ success: true, discount });
  } catch (error: unknown) {
    console.error('Error creating discount:', error);
    const message = error instanceof Error ? error.message : 'Failed to create discount';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
