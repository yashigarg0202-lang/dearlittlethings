import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Mio Studio database seed ---');

  // 1. Clean existing records for a fresh seed
  await prisma.auditLog.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shippingRate.deleteMany();
  await prisma.shippingZone.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.page.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const adminPasswordHash = await bcrypt.hash('StudioAdmin2026!', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@miostudio.craft',
      name: 'Yashi (Studio Founder)',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      mustChangePassword: true, // As required by security guidelines
    },
  });

  const customerPasswordHash = await bcrypt.hash('CustomerPass2026!', 12);
  const sampleCustomer = await prisma.user.create({
    data: {
      email: 'collector@studiojournal.craft',
      name: 'Elena Rostova',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      addresses: {
        create: {
          fullName: 'Elena Rostova',
          addressLine1: '742 Evergreen Terrace, Apt 3B',
          city: 'Portland',
          state: 'OR',
          postalCode: '97201',
          country: 'US',
          phone: '+1 503-555-0192',
          isDefaultShipping: true,
          isDefaultBilling: true,
        },
      },
    },
  });

  // 3. Site Settings
  await prisma.siteSettings.create({
    data: {
      id: 'default',
      storeName: 'dear little things',
      tagline: 'small things that make everything a little more beautiful',
      announcementText: 'Handmade with care — studio delivery across India',
      announcementLink: '/shop',
      announcementEnabled: true,
      currency: 'INR',
      currencySymbol: '₹',
      taxInclusive: true,
      contactEmail: 'yashi@dearlittlethings.studio',
      studioAddress: 'Dear Little Things Studio, India',
      instagramUrl: 'https://instagram.com/dearlittlethings',
      pinterestUrl: 'https://pinterest.com/dearlittlethings',
      heroHeadline: 'small things that make everything a little more beautiful.',
      heroSubhead: 'Thoughtfully designed stickers, keyrings, and small-batch handmade creative objects crafted for everyday wonder.',
      brandStatement: 'We believe the objects you carry, clip to your bag, or tuck into a notebook should carry warmth and personal intention. Every piece is designed or crafted in small studio batches.',
      editorialStoryTitle: 'Slow Craft & Conscious Making',
      editorialStoryExcerpt: 'From weather-resistant matte vinyl to tactile cotton threads, each texture is selected to bring daily joy.',
      makerStory: 'Dear Little Things began as a personal sketchbook practice on an old wooden desk. Today, each sticker sheet, charm, and pouch is still shaped with patience and small-scale care.',
    },
  });

  // 4. Categories
  const catStickers = await prisma.category.create({
    data: {
      name: 'Stickers',
      slug: 'stickers',
      introText: 'Matte vinyl and archival washi stickers for laptops, journals, and water bottles. Waterproof, tactile, and gently tinted.',
      editorialImage: '/assets/hero.jpg',
      sortOrder: 1,
    },
  });

  const catKeyrings = await prisma.category.create({
    data: {
      name: 'Keyrings & Charms',
      slug: 'keyrings',
      introText: 'Small tactile companions in solid brushed brass, ceramic beads, and waxed cotton cords. Made to accompany your daily keys.',
      editorialImage: '/placeholders/keyrings-editorial.svg',
      sortOrder: 2,
    },
  });

  const catCrochet = await prisma.category.create({
    data: {
      name: 'Handmade Crochet',
      slug: 'crochet',
      introText: 'Slow-stitched accessories, headphone cases, and pouch charms made with Oeko-Tex certified cotton and botanical-dyed wool.',
      editorialImage: '/placeholders/crochet-editorial.svg',
      sortOrder: 3,
    },
  });

  // 5. Collections
  const colMorningSun = await prisma.collection.create({
    data: {
      name: 'Morning Sun Series',
      slug: 'morning-sun',
      description: 'Warm ochres, botanical silhouettes, and gentle terracotta tones inspired by dawn light spilling onto a wooden worktable.',
      image: '/assets/hero.jpg',
      isFeatured: true,
      sortOrder: 1,
    },
  });

  const colQuietStudio = await prisma.collection.create({
    data: {
      name: 'Quiet Studio Essentials',
      slug: 'quiet-studio',
      description: 'Functional, tactile tools and miniature vessels designed to bring calm focus to your creative corner.',
      image: '/assets/hero.jpg',
      isFeatured: true,
      sortOrder: 2,
    },
  });

  // 6. Products & Variants & Images

  // Product 0: Diet Coke Vintage Cigarette Pack Sticker (Primary Reference Product)
  const prodDietCoke = await prisma.product.create({
    data: {
      title: 'Diet Coke Vintage Cigarette Pack Sticker',
      slug: 'diet-coke-vintage-cigarette-pack-sticker',
      description: 'A nostalgic vintage-inspired retro cigarette pack illustration featuring Diet Coke graphics. Printed on premium satin weatherproof vinyl with an ultra-matte, non-glare finish. Dishwasher, laptop, and water-bottle safe.',
      status: 'ACTIVE',
      categoryId: catStickers.id,
      tags: 'stickers,vintage,diet-coke,pop-art,retro',
      materials: 'Waterproof matte vinyl with protective UV-coating',
      dimensions: '7.5 cm × 5.0 cm',
      careInstructions: 'Peel gently from backing paper. Waterproof and dishwasher safe.',
      isHandmade: true,
      productionTime: 'Ready to ship in 1-2 business days',
      variationDisclaimer: 'Printed in small batches; subtle color depth variations may occur.',
      shippingNotes: 'Shipped flat in a rigid cardboard mailer to prevent bends.',
      seoTitle: 'Diet Coke Vintage Cigarette Pack Sticker | Dear Little Things',
      seoDescription: 'Vintage pop-art Diet Coke cigarette pack matte vinyl sticker.',
      isFeatured: true,
      images: {
        create: [
          {
            url: '/products/diet-coke-sticker.png',
            altText: 'Diet Coke Vintage Cigarette Pack Sticker on warm cream paper',
            sortOrder: 1,
            isPrimary: true,
          },
          {
            url: '/products/diet-coke-sticker-mockup.png',
            altText: 'Diet Coke sticker mockup detail',
            sortOrder: 2,
            isPrimary: false,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Single Die-Cut Sticker',
            sku: 'DLT-STK-COKE-01',
            price: 1000, // ₹10.00
            compareAtPrice: 1500, // ₹15.00
            stock: 60,
            weight: 10,
            optionValues: JSON.stringify({ Format: 'Single Sticker' }),
          },
          {
            name: 'Studio Trio Pack (3x)',
            sku: 'DLT-STK-COKE-03',
            price: 2500, // ₹25.00
            compareAtPrice: 3000,
            stock: 30,
            weight: 25,
            optionValues: JSON.stringify({ Format: 'Trio Pack' }),
          },
        ],
      },
      collections: {
        create: [{ collectionId: colMorningSun.id }],
      },
    },
  });

  // Product 1: Botanical Journal Sticker Sheet
  const prod1 = await prisma.product.create({
    data: {
      title: 'Botanical Sketchbook Sticker Sheet',
      slug: 'botanical-sketchbook-sticker-sheet',
      description: 'A delicate collection of pressed herbarium flora and pencil study vignettes. Printed on satin-finish weatherproof vinyl with a velvety paper-like touch.',
      status: 'ACTIVE',
      categoryId: catStickers.id,
      tags: 'stickers,botanical,stationery,journal',
      materials: 'Waterproof matte vinyl with archival pigment inks',
      dimensions: 'A6 sheet: 105 mm x 148 mm',
      careInstructions: 'Peel gently from sheet. Suitable for indoor and water bottle use.',
      isHandmade: true,
      productionTime: 'Ready to ship in 1-2 business days',
      variationDisclaimer: 'Printed in small batches; subtle color depth variations may occur.',
      shippingNotes: 'Shipped flat in a rigid cardboard mailer to prevent bends.',
      seoTitle: 'Botanical Sketchbook Sticker Sheet | Mio Studio',
      seoDescription: 'Handmade matte vinyl botanical sticker sheet for journals and sketchbooks.',
      isFeatured: true,
      images: {
        create: [
          {
            url: '/placeholders/product-stickers-1.svg',
            altText: 'Botanical sketchbook sticker sheet laid flat on warm linen',
            sortOrder: 1,
            isPrimary: true,
          },
          {
            url: '/placeholders/product-stickers-2.svg',
            altText: 'Close-up detail of kiss-cut botanical sticker peel',
            sortOrder: 2,
            isPrimary: false,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Single Sheet (A6)',
            sku: 'STK-BOT-A6-01',
            price: 650, // $6.50
            compareAtPrice: 800,
            stock: 45,
            weight: 20,
            optionValues: JSON.stringify({ Format: 'Single Sheet' }),
          },
          {
            name: 'Studio Bundle (Pack of 3)',
            sku: 'STK-BOT-PK3-02',
            price: 1650, // $16.50
            compareAtPrice: 1950,
            stock: 22,
            weight: 60,
            optionValues: JSON.stringify({ Format: 'Bundle Pack' }),
          },
        ],
      },
      collections: {
        create: [{ collectionId: colMorningSun.id }],
      },
    },
  });

  // Product 2: Meadow Mini Sticker Set
  const prod2 = await prisma.product.create({
    data: {
      title: 'Meadow Flora Die-Cut Sticker Trio',
      slug: 'meadow-flora-die-cut-sticker-trio',
      description: 'Three individual die-cut floral stickers featuring wild clover, dried chamomile, and field poppy. Heavyweight matte lamination that repels water and scratches.',
      status: 'ACTIVE',
      categoryId: catStickers.id,
      tags: 'stickers,die-cut,wildflower,matte',
      materials: 'Heavyweight vinyl with UV-protective matte coating',
      dimensions: 'Each sticker approximately 65 mm x 50 mm',
      careInstructions: 'Water-resistant. Hand-wash if placed on drinkware.',
      isHandmade: true,
      productionTime: 'Ready to ship in 1-2 business days',
      variationDisclaimer: 'Hand-inspected cuts may have minor microscopic edge nuance.',
      shippingNotes: 'Enclosed in glassine paper inside a rigid envelope.',
      seoTitle: 'Meadow Flora Die-Cut Sticker Trio | Mio Studio',
      seoDescription: 'Trio of weather-resistant matte vinyl wildflower stickers.',
      isFeatured: false,
      images: {
        create: [
          {
            url: '/placeholders/product-stickers-3.svg',
            altText: 'Three die-cut wildflower stickers on warm ivory paper',
            sortOrder: 1,
            isPrimary: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Standard Matte Finish',
            sku: 'STK-MDW-TRIO-01',
            price: 750, // $7.50
            stock: 38,
            weight: 15,
            optionValues: JSON.stringify({ Finish: 'Matte' }),
          },
        ],
      },
    },
  });

  // Product 3: Solid Brass Bell Charm Keyring
  const prod3 = await prisma.product.create({
    data: {
      title: 'Quiet Bell Brass Keyring Charm',
      slug: 'quiet-bell-brass-keyring-charm',
      description: 'A solid brushed brass miniature bell charm suspended from a hand-twisted waxed linen cord and solid brass split ring. Emits a soft, gentle chime that settles the mind.',
      status: 'ACTIVE',
      categoryId: catKeyrings.id,
      tags: 'keyrings,charms,brass,metalwork',
      materials: 'Solid unprocessed brass, Japanese waxed cord',
      dimensions: 'Total length 95 mm; bell diameter 18 mm',
      careInstructions: 'Brass develops a natural antique patina with touch. Polish gently with a dry microfiber cloth.',
      isHandmade: true,
      productionTime: 'Made to order: 2-3 business days',
      variationDisclaimer: 'Natural brass oxidation is intentional and reflects the piece settling into use.',
      shippingNotes: 'Packaged in an unbleached cotton drawstring pouch.',
      seoTitle: 'Quiet Bell Brass Keyring Charm | Mio Studio',
      seoDescription: 'Handmade solid brushed brass bell keyring charm with waxed cord.',
      isFeatured: true,
      images: {
        create: [
          {
            url: '/placeholders/product-keyring-1.svg',
            altText: 'Solid brass bell charm resting on weathered oak wood',
            sortOrder: 1,
            isPrimary: true,
          },
          {
            url: '/placeholders/product-keyring-2.svg',
            altText: 'Detail of hand-knotted waxed cord and brass split ring',
            sortOrder: 2,
            isPrimary: false,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Raw Brushed Brass',
            sku: 'KYR-BELL-RAW-01',
            price: 2400, // $24.00
            stock: 14,
            weight: 45,
            optionValues: JSON.stringify({ Finish: 'Brushed Brass' }),
          },
          {
            name: 'Aged Bronze Patina',
            sku: 'KYR-BELL-AGD-02',
            price: 2600, // $26.00
            stock: 8,
            weight: 45,
            optionValues: JSON.stringify({ Finish: 'Aged Bronze' }),
          },
        ],
      },
      collections: {
        create: [{ collectionId: colQuietStudio.id }],
      },
    },
  });

  // Product 4: Hand-Carved Wooden Bead Charm
  const prod4 = await prisma.product.create({
    data: {
      title: 'Terracotta & Wood Cord Charm',
      slug: 'terracotta-wood-cord-charm',
      description: 'Fired terracotta clay bead paired with natural cherry wood and brass spacers. Perfect for attaching to bags, keychains, or camera straps.',
      status: 'ACTIVE',
      categoryId: catKeyrings.id,
      tags: 'keyrings,clay,wood,bag-charm',
      materials: 'Stoneware terracotta clay, sustainably harvested cherry wood, waxed hemp',
      dimensions: 'Overall drop 110 mm',
      careInstructions: 'Wipe clean with a damp cloth. Do not soak in water.',
      isHandmade: true,
      productionTime: 'Ready to ship in 1-2 business days',
      variationDisclaimer: 'Each clay bead is formed by hand and bears gentle thumb impressions.',
      shippingNotes: 'Boxed in recycled kraft box with studio seal.',
      seoTitle: 'Terracotta & Wood Cord Charm | Mio Studio',
      seoDescription: 'Artisan handcrafted ceramic and wood key charm.',
      isFeatured: false,
      images: {
        create: [
          {
            url: '/placeholders/product-keyring-3.svg',
            altText: 'Ceramic terracotta bead and wooden keyring charm',
            sortOrder: 1,
            isPrimary: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Terracotta Earth',
            sku: 'KYR-CLY-TERRA-01',
            price: 1950, // $19.50
            stock: 18,
            weight: 35,
            optionValues: JSON.stringify({ Palette: 'Terracotta' }),
          },
          {
            name: 'Sage Stone',
            sku: 'KYR-CLY-SAGE-02',
            price: 1950, // $19.50
            stock: 12,
            weight: 35,
            optionValues: JSON.stringify({ Palette: 'Sage Stone' }),
          },
        ],
      },
      collections: {
        create: [{ collectionId: colMorningSun.id }],
      },
    },
  });

  // Product 5: Crochet Acorn Pouch Charm
  const prod5 = await prisma.product.create({
    data: {
      title: 'Crochet Acorn Pouch Charm',
      slug: 'crochet-acorn-pouch-charm',
      description: 'A miniature hollow acorn pouch crocheted from soft combed cotton. Features a snug removable wooden-bead drawstring closure to carry tiny treasures, earplugs, or folded notes.',
      status: 'ACTIVE',
      categoryId: catCrochet.id,
      tags: 'crochet,handmade,charm,acorn,pouch',
      materials: '100% Oeko-Tex cotton yarn, raw beechwood bead cord stopper',
      dimensions: 'Height 60 mm; diameter 45 mm',
      careInstructions: 'Spot clean with mild soap and cold water. Lay flat in shade to dry.',
      isHandmade: true,
      productionTime: 'Handmade to order: 3-5 business days',
      variationDisclaimer: 'Hand crocheted without a machine; subtle tension variations give each acorn its unique posture.',
      shippingNotes: 'Shipped in a reusable cotton dust envelope.',
      seoTitle: 'Crochet Acorn Pouch Charm | Mio Studio',
      seoDescription: 'Hand-crocheted miniature cotton acorn pouch charm.',
      isFeatured: true,
      images: {
        create: [
          {
            url: '/placeholders/product-crochet-1.svg',
            altText: 'Handmade crochet acorn pouch nestled on raw linen fabric',
            sortOrder: 1,
            isPrimary: true,
          },
          {
            url: '/placeholders/product-crochet-2.svg',
            altText: 'Crochet acorn pouch open showing cord closure',
            sortOrder: 2,
            isPrimary: false,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Natural Flax & Walnut',
            sku: 'CRC-ACRN-FLX-01',
            price: 2800, // $28.00
            stock: 9,
            weight: 30,
            optionValues: JSON.stringify({ Color: 'Natural Flax' }),
          },
          {
            name: 'Moss & Terracotta Cap',
            sku: 'CRC-ACRN-MSS-02',
            price: 2800, // $28.00
            stock: 6,
            weight: 30,
            optionValues: JSON.stringify({ Color: 'Moss & Terracotta' }),
          },
        ],
      },
      collections: {
        create: [{ collectionId: colMorningSun.id }, { collectionId: colQuietStudio.id }],
      },
    },
  });

  // Product 6: Crochet Ribbed Coin & Card Sleeve
  const prod6 = await prisma.product.create({
    data: {
      title: 'Hand-Crocheted Ribbed Card Sleeve',
      slug: 'hand-crocheted-ribbed-card-sleeve',
      description: 'Thick, dense half-double crochet stitch in rich warm earth tones. Sized to hold 6 payment cards and folded bank notes snugly without stretching out.',
      status: 'ACTIVE',
      categoryId: catCrochet.id,
      tags: 'crochet,wallet,card-sleeve,everyday',
      materials: 'Heavyweight organic mercerized cotton yarn',
      dimensions: '105 mm x 75 mm',
      careInstructions: 'Hand wash gently in lukewarm water. Reshape while damp.',
      isHandmade: true,
      productionTime: 'Handmade to order: 4-6 business days',
      variationDisclaimer: 'Handcrafted tension creates a personalized snug fit for your essential cards.',
      shippingNotes: 'Tied with a craft twine loop and studio tag.',
      seoTitle: 'Hand-Crocheted Ribbed Card Sleeve | Mio Studio',
      seoDescription: 'Minimalist handmade crochet cardholder in organic mercerized cotton.',
      isFeatured: false,
      images: {
        create: [
          {
            url: '/placeholders/product-crochet-3.svg',
            altText: 'Ribbed crochet card sleeve holding artisan wooden card',
            sortOrder: 1,
            isPrimary: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Dusty Rose',
            sku: 'CRC-SLV-ROSE-01',
            price: 2200, // $22.00
            stock: 15,
            weight: 35,
            optionValues: JSON.stringify({ Color: 'Dusty Rose' }),
          },
          {
            name: 'Soft Sage',
            sku: 'CRC-SLV-SAGE-02',
            price: 2200, // $22.00
            stock: 11,
            weight: 35,
            optionValues: JSON.stringify({ Color: 'Soft Sage' }),
          },
        ],
      },
    },
  });

  // 7. Shipping Zones & Rates
  const zoneDomestic = await prisma.shippingZone.create({
    data: {
      name: 'Studio Delivery (India)',
      countries: JSON.stringify(['IN']),
      isActive: true,
      rates: {
        create: [
          {
            name: 'Standard Studio Delivery',
            description: 'Carefully packed with rigid cardboard protection. Dispatched within 2-3 business days.',
            rate: 500, // ₹5.00
            minAmount: 0,
            maxAmount: 3000, // free over ₹30.00
            estimatedDaysMin: 3,
            estimatedDaysMax: 5,
            isActive: true,
          },
          {
            name: 'Complimentary Studio Delivery (Orders ₹30+)',
            description: 'Automatic complimentary delivery on qualifying studio orders.',
            rate: 0,
            minAmount: 3000,
            estimatedDaysMin: 3,
            estimatedDaysMax: 5,
            isActive: true,
          },
          {
            name: 'Express Studio Dispatch',
            description: 'Priority packing with direct courier delivery.',
            rate: 1200, // ₹12.00
            estimatedDaysMin: 1,
            estimatedDaysMax: 2,
            isActive: true,
          },
        ],
      },
    },
  });

  // 8. Discount Codes
  await prisma.discountCode.create({
    data: {
      code: 'WELCOME10',
      description: '10% off your first studio order',
      discountType: 'PERCENTAGE',
      value: 10,
      minSpend: 2000, // ₹20.00
      maxUses: 500,
      currentUses: 3,
      isActive: true,
    },
  });

  await prisma.discountCode.create({
    data: {
      code: 'STUDIO5',
      description: '₹5 off orders over ₹25',
      discountType: 'FIXED_AMOUNT',
      value: 500, // ₹5.00
      minSpend: 2500, // ₹25.00
      maxUses: 100,
      currentUses: 0,
      isActive: true,
    },
  });

  // 9. Editable Content Pages
  await prisma.page.create({
    data: {
      slug: 'about',
      title: 'our story',
      content: `### a tiny studio for tiny joys.

dear little things began as a quiet creative ritual on an old wooden desk. What started as sketchbook illustrations and small handmade experiments has grown into a small collection of objects we make to bring a little warmth and everyday beauty into your hands.

#### The Philosophy
We believe the objects you carry, clip to your bag, or tuck into a notebook should carry warmth and personal intention. Every sticker, charm, and crochet piece is designed or crafted in small studio batches.

#### Materials and Making
- **Stickers:** Produced with durable waterproof matte vinyl with satin laminate to repel water, scratches, and UV sunlight.
- **Keyrings & Charms:** Assembled with solid brushed brass, ceramic beads, and waxed linen cord.
- **Crochet:** Worked stitch by stitch with unbleached cotton and plant-dyed yarns.

All packages are shipped in recyclable cardboard mailers and glassine envelopes without single-use plastics.`,
      isPublished: true,
    },
  });

  await prisma.page.create({
    data: {
      slug: 'shipping-delivery',
      title: 'Shipping & Delivery',
      content: `### Studio Dispatch Times

Because our items are made or assembled by hand, fulfillment operates on a conscious schedule:

- **Ready-to-ship stickers & charms:** Dispatched within 1–2 business days.
- **Made-to-order crochet goods:** Hand-stitched with care and dispatched within 3–5 business days.

#### Delivery Options
- **Standard Studio Delivery:** 3–5 business days (₹5.00, or complimentary on orders over ₹30.00).
- **Express Studio Dispatch:** 1–2 business days (₹12.00).

Once you submit your order request, we personally reach out to confirm your pieces and arrange delivery.`,
      isPublished: true,
    },
  });

  // 10. Sample Order with status "Pending Confirmation"
  const prodCokeVariant = await prisma.productVariant.findFirst({ where: { productId: prodDietCoke.id } });

  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'DLT-2026-1001',
      userId: sampleCustomer.id,
      guestEmail: 'collector@studiojournal.craft',
      guestName: 'Elena Rostova',
      guestPhone: '+91 98765 43210',
      status: 'Pending Confirmation',
      subtotalAmount: 1000, // ₹10.00
      shippingAmount: 500,  // ₹5.00
      discountAmount: 0,
      totalAmount: 1500,    // ₹15.00
      currency: 'INR',
      shippingMethodName: 'Standard Studio Delivery',
      shippingAddress: JSON.stringify({
        fullName: 'Elena Rostova',
        addressLine1: '742 Craft Lane, Studio 3B',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '+91 98765 43210',
      }),
      customerNotes: 'Please pack with care. Looking forward to receiving this!',
      emailNotificationStatus: 'SENT',
      items: {
        create: [
          {
            variantId: prodCokeVariant?.id,
            productTitleSnapshot: 'Diet Coke Vintage Cigarette Pack Sticker',
            variantNameSnapshot: 'Single Die-Cut Sticker',
            skuSnapshot: 'DLT-STK-COKE-01',
            priceSnapshot: 1000,
            quantity: 1,
            imageSnapshot: '/products/diet-coke-sticker.png',
          },
        ],
      },
    },
  });

  // 11. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      adminUserId: adminUser.id,
      action: 'SYSTEM_INITIALIZE',
      entityType: 'STORE',
      entityId: 'seed',
      details: 'Catalogue seed completed with Dear Little Things products and INR currency.',
    },
  });

  console.log('--- Database seed completed successfully ---');
  console.log(`Admin account: admin@miostudio.craft (Password: StudioAdmin2026!)`);
  console.log(`Sample order created: DLT-2026-1001`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
