import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const zone = await prisma.shippingZone.findFirst({
      where: { isActive: true },
      include: {
        rates: {
          where: { isActive: true },
          orderBy: { rate: 'asc' },
        },
      },
    });

    return NextResponse.json(
      {
        rates: zone?.rates || [],
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    return NextResponse.json({ error: 'Failed to retrieve shipping rates' }, { status: 500 });
  }
}
