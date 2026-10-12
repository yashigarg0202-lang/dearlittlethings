import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession, GUEST_COOKIE_NAME } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    const cookieStore = await cookies();
    const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

    let items: any[] = [];
    if (session?.userId) {
      items = await prisma.wishlistItem.findMany({
        where: { userId: session.userId },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { orderBy: { price: 'asc' } },
            },
          },
        },
      });
    } else if (guestId) {
      items = await prisma.wishlistItem.findMany({
        where: { guestSessionId: guestId },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { orderBy: { price: 'asc' } },
            },
          },
        },
      });
    } else {
      items = [];
    }

    return NextResponse.json({
      items: items.map((i) => i.product),
      productIds: items.map((i) => i.productId),
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to retrieve wishlist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const session = await getSession();
    const cookieStore = await cookies();
    let guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

    if (!session?.userId && !guestId) {
      guestId = `guest_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    }

    let existing;
    if (session?.userId) {
      existing = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: { userId: session.userId, productId },
        },
      });
      if (existing) {
        await prisma.wishlistItem.delete({ where: { id: existing.id } });
        return NextResponse.json({ wishlisted: false });
      } else {
        await prisma.wishlistItem.create({
          data: { userId: session.userId, productId },
        });
        return NextResponse.json({ wishlisted: true });
      }
    } else {
      // Guest
      const guestExisting = await prisma.wishlistItem.findFirst({
        where: { guestSessionId: guestId, productId },
      });
      if (guestExisting) {
        await prisma.wishlistItem.delete({ where: { id: guestExisting.id } });
        return NextResponse.json({ wishlisted: false });
      } else {
        await prisma.wishlistItem.create({
          data: { guestSessionId: guestId, productId },
        });
        const res = NextResponse.json({ wishlisted: true });
        if (guestId && !cookieStore.get(GUEST_COOKIE_NAME)) {
          res.cookies.set(GUEST_COOKIE_NAME, guestId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
          });
        }
        return res;
      }
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
