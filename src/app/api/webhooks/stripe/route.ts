import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payment-provider';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get('stripe-signature') ||
      req.headers.get('x-test-signature') ||
      '';

    const provider = getPaymentProvider();
    const verification = await provider.verifyWebhook(rawBody, signature);

    if (!verification.isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const orderId = verification.orderId;
    if (!orderId) {
      return NextResponse.json({ received: true, ignored: 'no_order_id' });
    }

    // Idempotency: Check if order is already marked PAID
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (existingOrder.status === 'PAID') {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    // Atomically mark order as PAID and update Payment record
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      }),
      prisma.payment.updateMany({
        where: { orderId },
        data: {
          status: 'SUCCEEDED',
          paymentIntentId: verification.paymentIntentId || undefined,
          rawPayload: JSON.stringify({ verified: true, date: new Date().toISOString() }),
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'ORDER_PAYMENT_CONFIRMED',
          entityType: 'ORDER',
          entityId: orderId,
          details: `Order #${existingOrder.orderNumber} confirmed paid via verified webhook. Total: ₹${(existingOrder.totalAmount / 100).toFixed(2)}`,
        },
      }),
    ]);

    return NextResponse.json({ received: true, success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
