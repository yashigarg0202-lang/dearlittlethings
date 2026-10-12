import React from 'react';
import prisma from '@/lib/prisma';
import AdminShippingClient from '@/components/AdminShippingClient';

export const dynamic = 'force-dynamic';

export default async function AdminShippingPage() {
  const zones = await prisma.shippingZone.findMany({
    include: {
      rates: { orderBy: { rate: 'asc' } },
    },
  });

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: '0 0 0.25rem 0' }}>
          Shipping Zones & Delivery Rates
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
          Manage regional zones, studio packaging tiers, and thresholds for complimentary delivery.
        </p>
      </div>

      <AdminShippingClient initialZones={zones} />
    </div>
  );
}
