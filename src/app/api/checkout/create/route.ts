import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getOrCreateCartId, getCartCalculations, type CartItemWithVariant } from '@/lib/cart';
import { getSession } from '@/lib/auth';
import { sendOrderNotificationEmail, OrderEmailPayload } from '@/lib/email';

const CheckoutSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(5, 'Valid phone or WhatsApp number is required'),
  addressLine1: z.string().min(3, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(2, 'PIN code / postal code is required'),
  country: z.string().default('India'),
  shippingRateId: z.string().optional(),
  customerNotes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Please check your form details.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      fullName,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      shippingRateId,
      customerNotes,
    } = parsed.data;

    // 1. Fetch current cart and recalculate server-side
    const cartId = await getOrCreateCartId();
    const cartCalc = await getCartCalculations(cartId);

    if (cartCalc.items.length === 0) {
      return NextResponse.json({ error: 'Your shopping bag is empty.' }, { status: 400 });
    }

    // 2. Fetch shipping rate from database
    let shippingRate = null;
    if (shippingRateId && shippingRateId !== 'default') {
      shippingRate = await prisma.shippingRate.findUnique({
        where: { id: shippingRateId },
      });
    }

    if (!shippingRate) {
      shippingRate = await prisma.shippingRate.findFirst({
        where: { isActive: true },
        orderBy: { rate: 'asc' },
      });
    }

    const shippingRateName = shippingRate?.name || 'Standard Studio Delivery';
    let shippingCost = shippingRate?.rate ?? 9900;

    // Free delivery check if qualifying amount reached
    if (shippingRate && shippingRate.minAmount !== null && cartCalc.subtotal >= shippingRate.minAmount) {
      shippingCost = 0;
    }

    const session = await getSession();
    const userId = session?.userId || null;

    // Generate unique order reference (e.g. DLT-2026-4821)
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `DLT-${year}-${randomSuffix}`;
    const totalAmount = Math.max(0, cartCalc.total + shippingCost);

    // 3. Atomically verify stock, decrement stock, and create Order
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Validate inventory for each item
      for (const item of cartCalc.items as CartItemWithVariant[]) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant || variant.stock < item.quantity) {
          throw new Error(
            `"${item.variant.product.title}" (${item.variant.name}) has insufficient studio stock.`
          );
        }

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Create new Order with status "Pending Confirmation"
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          guestName: fullName,
          guestEmail: email,
          guestPhone: phone,
          status: 'Pending Confirmation',
          subtotalAmount: cartCalc.subtotal,
          discountAmount: cartCalc.discountAmount,
          discountCodeUsed: cartCalc.discountCode,
          shippingAmount: shippingCost,
          shippingMethodName: shippingRateName,
          totalAmount,
          currency: 'INR',
          shippingAddress: JSON.stringify({
            fullName,
            email,
            phone,
            addressLine1,
            addressLine2: addressLine2 || '',
            city,
            state: state || '',
            postalCode,
            country,
          }),
          customerNotes: customerNotes || null,
          emailNotificationStatus: 'PENDING',
          items: {
            create: (cartCalc.items as CartItemWithVariant[]).map((i: CartItemWithVariant) => ({
              variantId: i.variantId,
              productTitleSnapshot: i.variant.product.title,
              variantNameSnapshot: i.variant.name,
              skuSnapshot: i.variant.sku,
              priceSnapshot: i.variant.price,
              quantity: i.quantity,
              imageSnapshot: i.variant.product.images[0]?.url || null,
            })),
          },
        },
      });

      // Clear shopping bag
      await tx.cartItem.deleteMany({ where: { cartId } });

      // Update discount code usage if applicable
      if (cartCalc.discountCode) {
        await tx.discountCode.updateMany({
          where: { code: cartCalc.discountCode.toUpperCase() },
          data: { currentUses: { increment: 1 } },
        });
      }

      // Record system audit log
      await tx.auditLog.create({
        data: {
          action: 'ORDER_REQUEST_SUBMITTED',
          entityType: 'ORDER',
          entityId: newOrder.id,
          details: `Order request #${newOrder.orderNumber} submitted by ${fullName} (${email}). Status: Pending Confirmation. Total: ₹${(totalAmount / 100).toFixed(2)}`,
        },
      });

      return newOrder;
    });

    // 4. Send transactional notification email to store owner
    try {
      const emailPayload: OrderEmailPayload = {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: {
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          state: state || undefined,
          postalCode,
          country,
        },
        items: (cartCalc.items as CartItemWithVariant[]).map((i: CartItemWithVariant) => ({
          title: i.variant.product.title,
          variantName: i.variant.name,
          sku: i.variant.sku,
          quantity: i.quantity,
          unitPrice: i.variant.price,
          totalPrice: i.variant.price * i.quantity,
        })),
        subtotal: cartCalc.subtotal,
        discountAmount: cartCalc.discountAmount,
        discountCode: cartCalc.discountCode || undefined,
        shippingCost,
        total: totalAmount,
        customerNotes: customerNotes || undefined,
        status: 'Pending Confirmation',
      };

      const emailResult = await sendOrderNotificationEmail(emailPayload);

      if (emailResult.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            emailNotificationStatus: 'SENT',
          },
        });
      } else {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            emailNotificationStatus: 'FAILED',
            emailNotificationError: emailResult.error || 'Failed to dispatch email',
          },
        });
      }
    } catch (emailErr: unknown) {
      console.error('[Checkout] Email dispatch error:', emailErr);
      const emailMessage = emailErr instanceof Error ? emailErr.message : 'Email dispatch exception';
      // Preserve order even if email delivery fails, record status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          emailNotificationStatus: 'FAILED',
          emailNotificationError: emailMessage,
        },
      });
    }

    try {
      for (const item of cartCalc.items as CartItemWithVariant[]) {
        if (item.variant?.product?.slug) {
          revalidatePath(`/product/${item.variant.product.slug}`);
        }
      }
      revalidatePath('/shop');
    } catch (revalidateErr) {
      console.warn('Path revalidation failed:', revalidateErr);
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      totalAmount,
    });
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit order request.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
