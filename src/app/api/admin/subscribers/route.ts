import { NextRequest, NextResponse } from 'next/server';
import type { NewsletterSubscriber } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');

    const subscribers: NewsletterSubscriber[] = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      const csvHeader = 'Email,Status,SubscribedAt\n';
      const csvRows = subscribers
        .map((s: NewsletterSubscriber) => `"${s.email}","${s.status}","${s.createdAt.toISOString()}"`)
        .join('\n');
      const csvContent = csvHeader + csvRows;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="mio-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ subscribers });
  } catch (error: unknown) {
    console.error('Admin subscribers error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch subscribers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
