import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
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
    const action = searchParams.get('action');

    const where: Prisma.AuditLogWhereInput = {};
    if (action) {
      where.action = action;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ logs });
  } catch (error: unknown) {
    console.error('Audit log fetch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch audit logs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
