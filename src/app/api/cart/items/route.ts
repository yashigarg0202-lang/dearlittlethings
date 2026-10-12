import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getOrCreateCartId } from '@/lib/cart';

const AddItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(50).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AddItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid item data' }, { status: 400 });
    }

    const { variantId, quantity } = parsed.data;

    // Check variant existence and real stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return NextResponse.json({ error: 'Product variant not found' }, { status: 404 });
    }

    const cartId = await getOrCreateCartId();

    // Check if already in cart
    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId, variantId },
      },
    });

    const newQuantity = (existing?.quantity || 0) + quantity;
    if (newQuantity > variant.stock) {
      return NextResponse.json(
        { error: `Only ${variant.stock} available in studio stock.` },
        { status: 400 }
      );
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId, variantId, quantity },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
  }
}
