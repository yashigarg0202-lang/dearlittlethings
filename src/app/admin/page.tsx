import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [
    totalOrders,
    pendingOrders,
    paidOrders,
    totalProducts,
    lowStockVariants,
    recentOrders,
    subscriberCount,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ['PENDING', 'Pending Confirmation'] } } }),
    prisma.order.count({ where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'Confirmed'] } } }),
    prisma.product.count(),
    prisma.productVariant.findMany({
      where: { stock: { lte: 10 } },
      include: { product: true },
      take: 5,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: true },
    }),
    prisma.newsletterSubscriber.count(),
  ]);

  // Calculate gross sales from paid orders
  const paidOrdersList = await prisma.order.findMany({
    where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
    select: { totalAmount: true },
  });

  const grossSales = paidOrdersList.reduce((acc: number, o: { totalAmount: number }) => acc + o.totalAmount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Overview Title */}
      <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '1.25rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: '0 0 0.25rem 0' }}>
          Studio Operations Overview
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
          Real-time metrics from the SQLite database. Everything is live and editable.
        </p>
      </div>

      {/* Metric Cards (2x2 Asymmetrical Layout - NOT 3 cards in a row!) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            padding: '1.5rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Studio Revenue
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginTop: '0.3rem' }}>
            ${(grossSales / 100).toFixed(2)} USD
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-sage)' }}>
            From {paidOrders} confirmed orders
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            padding: '1.5rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Orders In Queue
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginTop: '0.3rem' }}>
            {pendingOrders} Pending
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-terracotta)' }}>
            {totalOrders} total recorded orders
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            padding: '1.5rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Catalogue Items
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginTop: '0.3rem' }}>
            {totalProducts} Active
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Across 3 core categories
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            padding: '1.5rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Subscribers Circle
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginTop: '0.3rem' }}>
            {subscriberCount} Members
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Studio letter readers
          </span>
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Inventory Alerts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'start',
        }}
      >
        {/* Recent Orders Table */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            padding: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', margin: 0 }}>
              Recent Studio Orders
            </h2>
            <Link href="/admin/orders" style={{ fontSize: '0.85rem', color: 'var(--accent-terracotta)' }}>
              View all orders &rarr;
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No orders yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentOrders.map((ord: { id: string; orderNumber: string; guestName: string | null; createdAt: Date; status: string; totalAmount: number; items: { id: string }[] }) => (
                <div
                  key={ord.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-hairline)',
                    fontSize: '0.88rem',
                  }}
                >
                  <div>
                    <strong>#{ord.orderNumber}</strong> &bull; {ord.guestName || 'Guest'}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {ord.items.length} items &bull; {new Date(ord.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '0.15rem 0.45rem',
                        backgroundColor: 'var(--bg-tag)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        display: 'inline-block',
                        marginBottom: '0.2rem',
                      }}
                    >
                      {ord.status}
                    </span>
                    <div style={{ fontWeight: 600 }}>
                      ${(ord.totalAmount / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            padding: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', margin: 0 }}>
              Studio Inventory Watch
            </h2>
            <Link href="/admin/inventory" style={{ fontSize: '0.85rem', color: 'var(--accent-terracotta)' }}>
              Manage stock &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {lowStockVariants.map((v: { id: string; name: string; sku: string; stock: number; product: { title: string } }) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-hairline)',
                  fontSize: '0.88rem',
                }}
              >
                <div>
                  <strong>{v.product.title}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Variant: {v.name} &bull; SKU: {v.sku}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.2rem 0.6rem',
                    backgroundColor: v.stock <= 5 ? 'var(--accent-terracotta-soft)' : 'var(--bg-tag)',
                    color: v.stock <= 5 ? 'var(--accent-terracotta)' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
                  {v.stock} in stock
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
