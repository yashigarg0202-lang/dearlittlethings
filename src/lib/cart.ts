import { cookies } from 'next/headers';
import type { Prisma } from '@prisma/client';
import prisma from './prisma';
import { getSession, GUEST_COOKIE_NAME } from './auth';

export type CartItemWithVariant = Prisma.CartItemGetPayload<{
  include: {
    variant: {
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } };
          };
        };
      };
    };
  };
}>;

export async function getExistingCartId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = await getSession();

  if (session?.userId) {
    const userCart = await prisma.cart.findFirst({
      where: { userId: session.userId },
      select: { id: true },
    });
    return userCart?.id || null;
  }

  const guestToken = cookieStore.get(GUEST_COOKIE_NAME)?.value;
  if (!guestToken) {
    return null;
  }

  const guestCart = await prisma.cart.findUnique({
    where: { guestSessionToken: guestToken },
    select: { id: true },
  });

  return guestCart?.id || null;
}

export async function getOrCreateCartId(): Promise<string> {
  const cookieStore = await cookies();
  const session = await getSession();

  if (session?.userId) {
    let userCart = await prisma.cart.findFirst({
      where: { userId: session.userId },
    });
    if (!userCart) {
      userCart = await prisma.cart.create({
        data: { userId: session.userId },
      });
    }
    return userCart.id;
  }

  // Guest flow
  let guestToken = cookieStore.get(GUEST_COOKIE_NAME)?.value;
  if (!guestToken) {
    guestToken = `guest_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    cookieStore.set(GUEST_COOKIE_NAME, guestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  let guestCart = await prisma.cart.findUnique({
    where: { guestSessionToken: guestToken },
  });

  if (!guestCart) {
    guestCart = await prisma.cart.create({
      data: { guestSessionToken: guestToken },
    });
  }

  return guestCart.id;
}

export async function mergeGuestCartIntoUser(guestToken: string, userId: string) {
  const guestCart = await prisma.cart.findUnique({
    where: { guestSessionToken: guestToken },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) return;

  let userCart = await prisma.cart.findFirst({
    where: { userId },
    include: { items: true },
  });

  if (!userCart) {
    userCart = await prisma.cart.create({
      data: { userId },
      include: { items: true },
    });
  }

  // Merge items
  for (const guestItem of guestCart.items) {
    const existing = userCart.items.find((i: { variantId: string }) => i.variantId === guestItem.variantId);
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + guestItem.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          variantId: guestItem.variantId,
          quantity: guestItem.quantity,
        },
      });
    }
  }

  // Delete guest cart
  await prisma.cart.delete({ where: { id: guestCart.id } });
}

export async function getCartCalculations(cartId: string) {
  if (!cartId) {
    return {
      id: '',
      items: [] as CartItemWithVariant[],
      discountCode: null,
      discountAmount: 0,
      subtotal: 0,
      total: 0,
      itemCount: 0,
    };
  }

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return {
      id: '',
      items: [] as CartItemWithVariant[],
      discountCode: null,
      discountAmount: 0,
      subtotal: 0,
      total: 0,
      itemCount: 0,
    };
  }

  // Server is source of truth: recalculate using current variant price in database
  let subtotal = 0;
  let itemCount = 0;

  const validItems = (cart.items as CartItemWithVariant[]).map((item: CartItemWithVariant) => {
    const itemSubtotal = item.variant.price * item.quantity;
    subtotal += itemSubtotal;
    itemCount += item.quantity;
    return item;
  });

  let discountAmount = 0;
  if (cart.discountCode) {
    const discount = await prisma.discountCode.findUnique({
      where: { code: cart.discountCode.toUpperCase() },
    });

    if (discount && discount.isActive) {
      if (!discount.minSpend || subtotal >= discount.minSpend) {
        if (discount.discountType === 'PERCENTAGE') {
          discountAmount = Math.round((subtotal * discount.value) / 100);
        } else if (discount.discountType === 'FIXED_AMOUNT') {
          discountAmount = Math.min(discount.value, subtotal);
        }
      }
    }
  }

  const total = Math.max(0, subtotal - discountAmount);

  return {
    id: cart.id,
    items: validItems,
    discountCode: cart.discountCode,
    discountAmount,
    subtotal,
    total,
    itemCount,
  };
}
