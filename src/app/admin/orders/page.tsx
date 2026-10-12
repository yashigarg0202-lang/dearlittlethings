import React from 'react';
import prisma from '@/lib/prisma';
import AdminOrdersClient from '@/components/AdminOrdersClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      payments: true,
    },
  });

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: '0 0 0.25rem 0' }}>
          Customer Orders ({orders.length})
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
          Manage statuses, dispatch packaging, courier tracking numbers, and direct WhatsApp contact.
        </p>
      </div>

      <AdminOrdersClient initialOrders={orders} />
    </div>
  );
}
