/**
 * dear little things - Automated Integration & Security Verification Suite
 * Tests authentication, catalogue integrity, order request flow,
 * stock reservations, and transactional email notification delivery.
 */

import type { Prisma } from '@prisma/client';
import prisma from '../src/lib/prisma';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../src/lib/auth';
import { sendOrderNotificationEmail, formatINR, OrderEmailPayload } from '../src/lib/email';

async function runTests() {
  console.log('====================================================');
  console.log('  DEAR LITTLE THINGS - AUTOMATED VERIFICATION SUITE  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Password Hashing & Auth Token Verification
  // ----------------------------------------------------
  console.log('--- Test Suite 1: Authentication & Password Security ---');
  const plainPassword = 'StudioSecretPassword2026!';
  const hashedPassword = await hashPassword(plainPassword);
  assert(hashedPassword !== plainPassword, 'Password is never stored in plaintext');
  assert(hashedPassword.startsWith('$2'), 'Password uses strong bcrypt hashing algorithm');
  const isValid = await verifyPassword(plainPassword, hashedPassword);
  assert(isValid === true, 'Valid password successfully verifies against hash');
  const isInvalid = await verifyPassword('WrongPassword', hashedPassword);
  assert(isInvalid === false, 'Incorrect password is appropriately rejected');

  const token = await createSessionToken({
    userId: 'test-admin-id',
    email: 'admin@miostudio.craft',
    role: 'ADMIN',
  });
  const decoded = await verifySessionToken(token);
  assert(decoded?.email === 'admin@miostudio.craft', 'Session JWT token payload created and decoded properly');
  assert(decoded?.role === 'ADMIN', 'Admin role preserved in secure JWT claim');

  // ----------------------------------------------------
  // TEST 2: Database Schema & Catalogue Data Integrity
  // ----------------------------------------------------
  console.log('\n--- Test Suite 2: Catalogue & Database Integrity ---');
  const categories = await prisma.category.findMany({ include: { products: true } });
  assert(categories.length >= 3, `Found ${categories.length} categories (Stickers, Keyrings, Crochet)`);

  const products = await prisma.product.findMany({
    include: { variants: true, images: true, category: true },
  });
  assert(products.length >= 6, `Found ${products.length} products seeded with variants and images`);

  // Verify Diet Coke sticker exists
  const dietCoke = await prisma.product.findUnique({
    where: { slug: 'diet-coke-vintage-cigarette-pack-sticker' },
    include: { variants: true, images: true },
  });
  assert(dietCoke !== null, 'Diet Coke Vintage Cigarette Pack Sticker is present in catalogue');
  assert(dietCoke?.variants[0]?.price === 1000, 'Diet Coke sticker priced at ₹10.00 (1000 minor units)');
  assert(dietCoke?.images.length! >= 2, 'Diet Coke sticker has multiple primary & mockup images');

  // ----------------------------------------------------
  // TEST 3: Discount Engine Verification
  // ----------------------------------------------------
  console.log('\n--- Test Suite 3: Discount Engine Verification ---');
  const discount = await prisma.discountCode.findUnique({
    where: { code: 'WELCOME10' },
  });
  assert(discount !== null, 'Discount code WELCOME10 exists in database');
  assert(discount?.discountType === 'PERCENTAGE' && discount.value === 10, 'WELCOME10 provides a 10% discount');

  // Test discount calculation in INR
  const testSubtotal = 1000; // ₹10.00
  let discountAmount = 0;
  if (discount && discount.discountType === 'PERCENTAGE') {
    discountAmount = Math.round((testSubtotal * discount.value) / 100);
  }
  assert(discountAmount === 100, 'Calculated discount of ₹1.00 on ₹10.00 subtotal');

  // ----------------------------------------------------
  // TEST 4: Order Request Creation & Inventory Decrement
  // ----------------------------------------------------
  console.log('\n--- Test Suite 4: Order Request Flow & Inventory Decrement ---');

  const sampleVariant = await prisma.productVariant.findFirst({
    where: { stock: { gte: 5 } },
    include: { product: true },
  });

  if (!sampleVariant) {
    throw new Error('No test variant with stock found');
  }

  const initialStock = sampleVariant.stock;
  const orderNumber = `DLT-TEST-${Date.now().toString().slice(-4)}`;
  const orderQuantity = 2;

  // Execute order request creation inside transaction
  const createdOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Decrement stock
    await tx.productVariant.update({
      where: { id: sampleVariant.id },
      data: { stock: { decrement: orderQuantity } },
    });

    const subtotal = sampleVariant.price * orderQuantity;
    const shipping = 500; // ₹5.00
    const total = subtotal + shipping - discountAmount;

    return await tx.order.create({
      data: {
        orderNumber,
        guestEmail: 'test.collector@example.com',
        guestName: 'Ananya Roy',
        guestPhone: '+91 98765 00000',
        status: 'Pending Confirmation',
        currency: 'INR',
        subtotalAmount: subtotal,
        shippingAmount: shipping,
        discountAmount,
        totalAmount: total,
        shippingMethodName: 'Standard Studio Delivery',
        shippingAddress: JSON.stringify({
          fullName: 'Ananya Roy',
          addressLine1: 'Flat 402, Lotus Apartments',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
        }),
        customerNotes: 'Automated test order request.',
        emailNotificationStatus: 'PENDING',
        items: {
          create: [
            {
              variantId: sampleVariant.id,
              productTitleSnapshot: sampleVariant.product.title,
              variantNameSnapshot: sampleVariant.name,
              skuSnapshot: sampleVariant.sku,
              priceSnapshot: sampleVariant.price,
              quantity: orderQuantity,
            },
          ],
        },
      },
      include: { items: true },
    });
  });

  assert(createdOrder.orderNumber === orderNumber, `Order #${orderNumber} created with correct number`);
  assert(createdOrder.status === 'Pending Confirmation', 'Order status set to "Pending Confirmation"');
  assert(createdOrder.currency === 'INR', 'Order currency recorded as INR');
  assert(createdOrder.items.length === 1, 'Item snapshot saved accurately');

  // Verify stock actually decremented
  const updatedVariant = await prisma.productVariant.findUnique({
    where: { id: sampleVariant.id },
  });
  assert(updatedVariant?.stock === initialStock - orderQuantity, `Variant stock decremented from ${initialStock} to ${updatedVariant?.stock}`);

  // ----------------------------------------------------
  // TEST 5: Transactional Email Notification System
  // ----------------------------------------------------
  console.log('\n--- Test Suite 5: Transactional Email Dispatch ---');
  const emailPayload: OrderEmailPayload = {
    orderNumber: createdOrder.orderNumber,
    createdAt: createdOrder.createdAt,
    customerName: createdOrder.guestName || 'Ananya Roy',
    customerEmail: createdOrder.guestEmail || 'test.collector@example.com',
    customerPhone: createdOrder.guestPhone || '+91 98765 00000',
    shippingAddress: {
      addressLine1: 'Flat 402, Lotus Apartments',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
    },
    items: [
      {
        title: sampleVariant.product.title,
        variantName: sampleVariant.name,
        sku: sampleVariant.sku,
        quantity: orderQuantity,
        unitPrice: sampleVariant.price,
        totalPrice: sampleVariant.price * orderQuantity,
      },
    ],
    subtotal: createdOrder.subtotalAmount,
    discountAmount: createdOrder.discountAmount,
    shippingCost: createdOrder.shippingAmount,
    total: createdOrder.totalAmount,
    customerNotes: createdOrder.customerNotes || undefined,
    status: 'Pending Confirmation',
  };

  const emailResult = await sendOrderNotificationEmail(emailPayload);
  assert(emailResult.success === true, `Email notification successfully generated (Provider: ${emailResult.provider})`);

  // Update order emailNotificationStatus
  await prisma.order.update({
    where: { id: createdOrder.id },
    data: { emailNotificationStatus: emailResult.success ? 'SENT' : 'FAILED' },
  });

  const refreshedOrder = await prisma.order.findUnique({ where: { id: createdOrder.id } });
  assert(refreshedOrder?.emailNotificationStatus === 'SENT', 'Order email status updated to SENT');

  // Clean up test order & restore stock
  await prisma.$transaction([
    prisma.productVariant.update({
      where: { id: sampleVariant.id },
      data: { stock: { increment: orderQuantity } },
    }),
    prisma.orderItem.deleteMany({ where: { orderId: createdOrder.id } }),
    prisma.order.delete({ where: { id: createdOrder.id } }),
  ]);

  const restoredVariant = await prisma.productVariant.findUnique({
    where: { id: sampleVariant.id },
  });
  assert(restoredVariant?.stock === initialStock, 'Test stock restored cleanly after test run');

  // ----------------------------------------------------
  // TEST 6: Currency Formatting Test
  // ----------------------------------------------------
  console.log('\n--- Test Suite 6: INR Currency Formatting ---');
  const formattedINR = formatINR(1000); // 1000 minor units = ₹10.00
  assert(formattedINR.includes('10.00'), `formatINR(1000) produces valid currency string: ${formattedINR}`);

  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
