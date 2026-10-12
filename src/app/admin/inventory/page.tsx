import React from 'react';
import prisma from '@/lib/prisma';
import AdminInventoryClient from '@/components/AdminInventoryClient';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  const variants = await prisma.productVariant.findMany({
    orderBy: { stock: 'asc' },
    include: {
      product: {
        include: { category: true },
      },
    },
  });

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: '0 0 0.25rem 0' }}>
          Studio Inventory & Stock Controls
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
          Manage real-time variant stock units. Items sorted with low stock indicators first.
        </p>
      </div>

      <AdminInventoryClient initialVariants={variants} />
    </div>
  );
}
