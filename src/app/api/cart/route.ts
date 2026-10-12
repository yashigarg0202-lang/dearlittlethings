import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrCreateCartId, getCartCalculations } from '@/lib/cart';
import { GUEST_COOKIE_NAME } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    let guestToken = cookieStore.get(GUEST_COOKIE_NAME)?.value;
    let shouldSetGuestCookie = false;

    if (!guestToken) {
      guestToken = `guest_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      shouldSetGuestCookie = true;
    }

    const cartId = await getOrCreateCartId();
    const data = await getCartCalculations(cartId);

    const response = NextResponse.json(data);
    if (shouldSetGuestCookie) {
      response.cookies.set(GUEST_COOKIE_NAME, guestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to retrieve cart' }, { status: 500 });
  }
}
