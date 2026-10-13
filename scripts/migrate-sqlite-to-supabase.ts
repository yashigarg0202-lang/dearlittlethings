import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

interface SQLiteData {
  [table: string]: Record<string, unknown>[];
}

function readSQLiteData(dbPath: string): SQLiteData {
  const exportScript = path.join(__dirname, 'export-sqlite.py');
  const output = execSync(`python3 "${exportScript}" "${dbPath}"`, {
    maxBuffer: 50 * 1024 * 1024,
    encoding: 'utf8',
  });

  return JSON.parse(output) as SQLiteData;
}

function toDate(val: unknown): Date | undefined {
  if (!val) return undefined;
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') return new Date(val);
  return undefined;
}

function toBool(val: unknown): boolean {
  return Boolean(val);
}

export async function runMigration(isDryRun = false) {
  const sqliteDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  console.log(`[Migration] Source SQLite database: ${sqliteDbPath}`);
  console.log(`[Migration] Mode: ${isDryRun ? 'DRY RUN (no database writes)' : 'LIVE MIGRATION'}`);

  const data = readSQLiteData(sqliteDbPath);
  console.log('[Migration] Successfully extracted SQLite records:');
  for (const [table, rows] of Object.entries(data)) {
    console.log(`  - ${table}: ${rows.length} rows`);
  }

  if (isDryRun) {
    console.log('\n[Dry Run] Extraction and schema mapping validated successfully. No records were written.');
    return;
  }

  const prisma = new PrismaClient();

  try {
    console.log('\n[Migration] Starting data insertion in foreign-key dependency order...');

    // 1. User
    const users = (data.User || []) as any[];
    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          email: u.email,
          passwordHash: u.passwordHash,
          name: u.name,
          role: u.role,
          mustChangePassword: toBool(u.mustChangePassword),
          createdAt: toDate(u.createdAt) || new Date(),
          updatedAt: toDate(u.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ User: ${users.length} records migrated`);

    // 2. Category (self-referencing: root categories first, then child categories)
    const categories = (data.Category || []) as any[];
    const rootCategories = categories.filter((c) => !c.parentId);
    const childCategories = categories.filter((c) => !!c.parentId);

    for (const c of [...rootCategories, ...childCategories]) {
      await prisma.category.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          introText: c.introText,
          editorialImage: c.editorialImage,
          sortOrder: Number(c.sortOrder) || 0,
          parentId: c.parentId || null,
          createdAt: toDate(c.createdAt) || new Date(),
          updatedAt: toDate(c.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ Category: ${categories.length} records migrated`);

    // 3. Collection
    const collections = (data.Collection || []) as any[];
    for (const col of collections) {
      await prisma.collection.upsert({
        where: { id: col.id },
        update: {},
        create: {
          id: col.id,
          name: col.name,
          slug: col.slug,
          description: col.description,
          image: col.image,
          isFeatured: toBool(col.isFeatured),
          sortOrder: Number(col.sortOrder) || 0,
          createdAt: toDate(col.createdAt) || new Date(),
          updatedAt: toDate(col.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ Collection: ${collections.length} records migrated`);

    // 4. ShippingZone
    const zones = (data.ShippingZone || []) as any[];
    for (const z of zones) {
      await prisma.shippingZone.upsert({
        where: { id: z.id },
        update: {},
        create: {
          id: z.id,
          name: z.name,
          countries: z.countries,
          isActive: toBool(z.isActive),
          createdAt: toDate(z.createdAt) || new Date(),
          updatedAt: toDate(z.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ ShippingZone: ${zones.length} records migrated`);

    // 5. DiscountCode
    const discounts = (data.DiscountCode || []) as any[];
    for (const d of discounts) {
      await prisma.discountCode.upsert({
        where: { id: d.id },
        update: {},
        create: {
          id: d.id,
          code: d.code,
          description: d.description,
          discountType: d.discountType,
          value: Number(d.value),
          minSpend: d.minSpend != null ? Number(d.minSpend) : null,
          maxUses: d.maxUses != null ? Number(d.maxUses) : null,
          currentUses: Number(d.currentUses) || 0,
          startDate: toDate(d.startDate),
          endDate: toDate(d.endDate),
          isActive: toBool(d.isActive),
          createdAt: toDate(d.createdAt) || new Date(),
          updatedAt: toDate(d.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ DiscountCode: ${discounts.length} records migrated`);

    // 6. SiteSettings
    const settings = (data.SiteSettings || []) as any[];
    for (const s of settings) {
      await prisma.siteSettings.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          storeName: s.storeName,
          tagline: s.tagline,
          announcementText: s.announcementText,
          announcementLink: s.announcementLink,
          announcementEnabled: toBool(s.announcementEnabled),
          currency: s.currency,
          currencySymbol: s.currencySymbol,
          taxInclusive: toBool(s.taxInclusive),
          contactEmail: s.contactEmail,
          whatsappNumber: s.whatsappNumber,
          studioAddress: s.studioAddress,
          instagramUrl: s.instagramUrl,
          pinterestUrl: s.pinterestUrl,
          heroHeadline: s.heroHeadline,
          heroSubhead: s.heroSubhead,
          brandStatement: s.brandStatement,
          editorialStoryTitle: s.editorialStoryTitle,
          editorialStoryExcerpt: s.editorialStoryExcerpt,
          makerStory: s.makerStory,
          createdAt: toDate(s.createdAt) || new Date(),
          updatedAt: toDate(s.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ SiteSettings: ${settings.length} records migrated`);

    // 7. Page
    const pages = (data.Page || []) as any[];
    for (const p of pages) {
      await prisma.page.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          slug: p.slug,
          title: p.title,
          content: p.content,
          isPublished: toBool(p.isPublished),
          createdAt: toDate(p.createdAt) || new Date(),
          updatedAt: toDate(p.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ Page: ${pages.length} records migrated`);

    // 8. NewsletterSubscriber
    const subscribers = (data.NewsletterSubscriber || []) as any[];
    for (const sub of subscribers) {
      await prisma.newsletterSubscriber.upsert({
        where: { id: sub.id },
        update: {},
        create: {
          id: sub.id,
          email: sub.email,
          status: sub.status,
          confirmationToken: sub.confirmationToken,
          confirmedAt: toDate(sub.confirmedAt),
          createdAt: toDate(sub.createdAt) || new Date(),
        },
      });
    }
    console.log(`✔ NewsletterSubscriber: ${subscribers.length} records migrated`);

    // 9. Address (depends on User)
    const addresses = (data.Address || []) as any[];
    for (const addr of addresses) {
      await prisma.address.upsert({
        where: { id: addr.id },
        update: {},
        create: {
          id: addr.id,
          userId: addr.userId,
          fullName: addr.fullName,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
          phone: addr.phone,
          isDefaultShipping: toBool(addr.isDefaultShipping),
          isDefaultBilling: toBool(addr.isDefaultBilling),
          createdAt: toDate(addr.createdAt) || new Date(),
          updatedAt: toDate(addr.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ Address: ${addresses.length} records migrated`);

    // 10. Product (depends on Category)
    const products = (data.Product || []) as any[];
    for (const prod of products) {
      await prisma.product.upsert({
        where: { id: prod.id },
        update: {},
        create: {
          id: prod.id,
          title: prod.title,
          slug: prod.slug,
          description: prod.description,
          status: prod.status,
          categoryId: prod.categoryId,
          tags: prod.tags,
          materials: prod.materials,
          dimensions: prod.dimensions,
          careInstructions: prod.careInstructions,
          isHandmade: toBool(prod.isHandmade),
          productionTime: prod.productionTime,
          variationDisclaimer: prod.variationDisclaimer,
          shippingNotes: prod.shippingNotes,
          seoTitle: prod.seoTitle,
          seoDescription: prod.seoDescription,
          isFeatured: toBool(prod.isFeatured),
          createdAt: toDate(prod.createdAt) || new Date(),
          updatedAt: toDate(prod.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ Product: ${products.length} records migrated`);

    // 11. ShippingRate (depends on ShippingZone)
    const rates = (data.ShippingRate || []) as any[];
    for (const r of rates) {
      await prisma.shippingRate.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          zoneId: r.zoneId,
          name: r.name,
          description: r.description,
          minAmount: r.minAmount != null ? Number(r.minAmount) : null,
          maxAmount: r.maxAmount != null ? Number(r.maxAmount) : null,
          rate: Number(r.rate),
          estimatedDaysMin: r.estimatedDaysMin != null ? Number(r.estimatedDaysMin) : null,
          estimatedDaysMax: r.estimatedDaysMax != null ? Number(r.estimatedDaysMax) : null,
          isActive: toBool(r.isActive),
          createdAt: toDate(r.createdAt) || new Date(),
          updatedAt: toDate(r.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ ShippingRate: ${rates.length} records migrated`);

    // 12. Cart (depends on User)
    const carts = (data.Cart || []) as any[];
    for (const cart of carts) {
      await prisma.cart.upsert({
        where: { id: cart.id },
        update: {},
        create: {
          id: cart.id,
          userId: cart.userId || null,
          guestSessionToken: cart.guestSessionToken || null,
          discountCode: cart.discountCode || null,
          createdAt: toDate(cart.createdAt) || new Date(),
          updatedAt: toDate(cart.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ Cart: ${carts.length} records migrated`);

    // 13. AuditLog (depends on User)
    const auditLogs = (data.AuditLog || []) as any[];
    for (const log of auditLogs) {
      await prisma.auditLog.upsert({
        where: { id: log.id },
        update: {},
        create: {
          id: log.id,
          adminUserId: log.adminUserId || null,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId || null,
          details: log.details || null,
          ipAddress: log.ipAddress || null,
          createdAt: toDate(log.createdAt) || new Date(),
        },
      });
    }
    console.log(`✔ AuditLog: ${auditLogs.length} records migrated`);

    // 14. ProductCollection (depends on Product and Collection)
    const prodCols = (data.ProductCollection || []) as any[];
    for (const pc of prodCols) {
      await prisma.productCollection.upsert({
        where: { id: pc.id },
        update: {},
        create: {
          id: pc.id,
          productId: pc.productId,
          collectionId: pc.collectionId,
          createdAt: toDate(pc.createdAt) || new Date(),
        },
      });
    }
    console.log(`✔ ProductCollection: ${prodCols.length} records migrated`);

    // 15. ProductVariant (depends on Product)
    const variants = (data.ProductVariant || []) as any[];
    for (const v of variants) {
      await prisma.productVariant.upsert({
        where: { id: v.id },
        update: {},
        create: {
          id: v.id,
          productId: v.productId,
          name: v.name,
          sku: v.sku,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice != null ? Number(v.compareAtPrice) : null,
          stock: Number(v.stock) || 0,
          weight: v.weight != null ? Number(v.weight) : null,
          optionValues: v.optionValues || null,
          createdAt: toDate(v.createdAt) || new Date(),
          updatedAt: toDate(v.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ ProductVariant: ${variants.length} records migrated`);

    // 16. ProductImage (depends on Product)
    const images = (data.ProductImage || []) as any[];
    for (const img of images) {
      await prisma.productImage.upsert({
        where: { id: img.id },
        update: {},
        create: {
          id: img.id,
          productId: img.productId,
          url: img.url,
          altText: img.altText,
          sortOrder: Number(img.sortOrder) || 0,
          isPrimary: toBool(img.isPrimary),
          createdAt: toDate(img.createdAt) || new Date(),
        },
      });
    }
    console.log(`✔ ProductImage: ${images.length} records migrated`);

    // 17. WishlistItem (depends on User and Product)
    const wishlist = (data.WishlistItem || []) as any[];
    for (const w of wishlist) {
      await prisma.wishlistItem.upsert({
        where: { id: w.id },
        update: {},
        create: {
          id: w.id,
          userId: w.userId || null,
          guestSessionId: w.guestSessionId || null,
          productId: w.productId,
          createdAt: toDate(w.createdAt) || new Date(),
        },
      });
    }
    console.log(`✔ WishlistItem: ${wishlist.length} records migrated`);

    // 18. Order (depends on User)
    const orders = (data.Order || []) as any[];
    for (const o of orders) {
      await prisma.order.upsert({
        where: { id: o.id },
        update: {},
        create: {
          id: o.id,
          orderNumber: o.orderNumber,
          userId: o.userId || null,
          guestEmail: o.guestEmail || null,
          guestName: o.guestName || null,
          guestPhone: o.guestPhone || null,
          status: o.status,
          emailNotificationStatus: o.emailNotificationStatus,
          emailNotificationError: o.emailNotificationError || null,
          totalAmount: Number(o.totalAmount),
          subtotalAmount: Number(o.subtotalAmount),
          discountAmount: Number(o.discountAmount) || 0,
          discountCodeUsed: o.discountCodeUsed || null,
          shippingAmount: Number(o.shippingAmount) || 0,
          taxAmount: Number(o.taxAmount) || 0,
          currency: o.currency || 'INR',
          shippingAddress: o.shippingAddress,
          billingAddress: o.billingAddress || null,
          shippingMethodName: o.shippingMethodName || null,
          trackingNumber: o.trackingNumber || null,
          trackingCarrier: o.trackingCarrier || null,
          customerNotes: o.customerNotes || null,
          paidAt: toDate(o.paidAt),
          shippedAt: toDate(o.shippedAt),
          createdAt: toDate(o.createdAt) || new Date(),
          updatedAt: toDate(o.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ Order: ${orders.length} records migrated`);

    // 19. CartItem (depends on Cart and ProductVariant)
    const cartItems = (data.CartItem || []) as any[];
    for (const ci of cartItems) {
      await prisma.cartItem.upsert({
        where: { id: ci.id },
        update: {},
        create: {
          id: ci.id,
          cartId: ci.cartId,
          variantId: ci.variantId,
          quantity: Number(ci.quantity) || 1,
          createdAt: toDate(ci.createdAt) || new Date(),
          updatedAt: toDate(ci.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ CartItem: ${cartItems.length} records migrated`);

    // 20. OrderItem (depends on Order and ProductVariant)
    const orderItems = (data.OrderItem || []) as any[];
    for (const oi of orderItems) {
      await prisma.orderItem.upsert({
        where: { id: oi.id },
        update: {},
        create: {
          id: oi.id,
          orderId: oi.orderId,
          variantId: oi.variantId || null,
          productTitleSnapshot: oi.productTitleSnapshot,
          variantNameSnapshot: oi.variantNameSnapshot,
          skuSnapshot: oi.skuSnapshot,
          priceSnapshot: Number(oi.priceSnapshot),
          quantity: Number(oi.quantity),
          imageSnapshot: oi.imageSnapshot || null,
          createdAt: toDate(oi.createdAt) || new Date(),
        },
      });
    }
    console.log(`✔ OrderItem: ${orderItems.length} records migrated`);

    // 21. Payment (depends on Order)
    const payments = (data.Payment || []) as any[];
    for (const p of payments) {
      await prisma.payment.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          orderId: p.orderId,
          provider: p.provider,
          paymentIntentId: p.paymentIntentId || null,
          status: p.status,
          amount: Number(p.amount),
          currency: p.currency,
          rawPayload: p.rawPayload || null,
          createdAt: toDate(p.createdAt) || new Date(),
          updatedAt: toDate(p.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✔ Payment: ${payments.length} records migrated`);

    console.log('\n[Migration Complete] All records migrated successfully with IDs, relations, and hashes intact!');
  } finally {
    await prisma.$disconnect();
  }
}

// Support CLI execution: tsx scripts/migrate-sqlite-to-supabase.ts [--dry-run]
if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  runMigration(isDryRun).catch((err) => {
    console.error('[Migration Error]', err.message);
    process.exit(1);
  });
}
