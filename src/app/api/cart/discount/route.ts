import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getOrCreateCartId, getCartCalculations } from '@/lib/cart';
import { checkRateLimit } from '@/lib/rate-limit';

const DiscountSchema = z.object({
  code: z.string().min(1).max(30),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit check: max 5 coupon attempts per minute
    const ip = req.headers.get('x-forwarded-for') || 'local_user';
    const rateLimit = checkRateLimit(ip, 'coupon_check', 5, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many discount code attempts. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = DiscountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid code' }, { status: 400 });
    }

    const code = parsed.data.code.trim().toUpperCase();
    const discount = await prisma.discountCode.findUnique({
      where: { code },
    });

    if (!discount || !discount.isActive) {
      return NextResponse.json({ error: 'Discount code not found or expired' }, { status: 404 });
    }

    if (discount.maxUses && discount.currentUses >= discount.maxUses) {
      return NextResponse.json({ error: 'This discount code has reached its usage limit' }, { status: 400 });
    }

    const cartId = await getOrCreateCartId();
    const cartCalc = await getCartCalculations(cartId);

    if (discount.minSpend && cartCalc.subtotal < discount.minSpend) {
      const minSpendFormatted = (discount.minSpend / 100).toFixed(2);
      return NextResponse.json(
        { error: `This code requires a minimum spend of $${minSpendFormatted}` },
        { status: 400 }
      );
    }

    await prisma.cart.update({
      where: { id: cartId },
      data: { discountCode: code },
    });

    return NextResponse.json({
      success: true,
      message: `Applied ${discount.description || code}!`,
    });
  } catch (error) {
    console.error('Error applying discount:', error);
    return NextResponse.json({ error: 'Failed to apply discount' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cartId = await getOrCreateCartId();
    await prisma.cart.update({
      where: { id: cartId },
      data: { discountCode: null },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing discount:', error);
    return NextResponse.json({ error: 'Failed to remove discount' }, { status: 500 });
  }
}
