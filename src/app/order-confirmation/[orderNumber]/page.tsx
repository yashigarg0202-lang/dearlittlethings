import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import OrderConfirmationClient from '@/components/OrderConfirmationClient';

export const dynamic = 'force-dynamic';

interface OrderConfirmationProps {
  params: Promise<{ orderNumber: string }>;
}

export async function generateMetadata({ params }: OrderConfirmationProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Order Request #${orderNumber} | dear little things`,
    description: `Your order request #${orderNumber} has been received by our studio.`,
  };
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationProps) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  const address = JSON.parse(order.shippingAddress || '{}');

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '4rem 1.5rem 8rem 1.5rem' }}>
      <OrderConfirmationClient
        order={order}
        address={address}
      />
    </div>
  );
}
