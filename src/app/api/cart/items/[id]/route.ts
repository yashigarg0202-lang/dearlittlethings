import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getOrCreateCartId, getExistingCartId, getCartCalculations } from '@/lib/cart';

const UpdateSchema = z.object({
  quantity: z.number().int().min(0).max(50),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    const cartId = await getOrCreateCartId();
    const item = await prisma.cartItem.findFirst({
      where: {
        cartId,
        OR: [{ id }, { variantId: id }],
      },
      include: { variant: true },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found in your cart' }, { status: 404 });
    }

    if (parsed.data.quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId,
          OR: [{ id }, { variantId: id }],
        },
      });
      const updatedCart = await getCartCalculations(cartId);
      return NextResponse.json({ success: true, removed: true, cart: updatedCart });
    }

    if (parsed.data.quantity > item.variant.stock) {
      return NextResponse.json(
        { error: `Only ${item.variant.stock} available in stock.` },
        { status: 400 }
      );
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: parsed.data.quantity },
    });

    const updatedCart = await getCartCalculations(cartId);
    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cartId = await getExistingCartId();

    if (!cartId) {
      return NextResponse.json({
        success: true,
        cart: {
          id: '',
          items: [],
          discountCode: null,
          discountAmount: 0,
          subtotal: 0,
          total: 0,
          itemCount: 0,
        },
      });
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId,
        OR: [{ id }, { variantId: id }],
      },
    });

    const updatedCart = await getCartCalculations(cartId);
    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
