import React from 'react';
import prisma from '@/lib/prisma';
import AdminDiscountsClient from '@/components/AdminDiscountsClient';

export const dynamic = 'force-dynamic';

export default async function AdminDiscountsPage() {
  const discounts = await prisma.discountCode.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: '0 0 0.25rem 0' }}>
          Discount & Coupon Codes ({discounts.length})
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
          Manage percentage discounts, fixed reductions, minimum spend constraints, and redemption counts.
        </p>
      </div>

      <AdminDiscountsClient initialDiscounts={discounts} />
    </div>
  );
}
