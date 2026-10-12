import Stripe from 'stripe';

export interface PaymentSessionResult {
  checkoutUrl: string;
  paymentIntentId: string;
}

export interface PaymentProvider {
  name: string;
  createCheckoutSession(params: {
    orderId: string;
    orderNumber: string;
    totalAmount: number; // in cents
    currency: string;
    customerEmail: string;
    items: {
      title: string;
      unitPrice: number;
      quantity: number;
    }[];
    shippingAmount: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<PaymentSessionResult>;

  verifyWebhook(rawBody: string, signature: string): Promise<{
    isValid: boolean;
    eventType: string;
    orderId?: string;
    paymentIntentId?: string;
  }>;
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia' as any,
    })
  : null;

/**
 * Real Stripe Checkout Provider
 */
export const stripeProvider: PaymentProvider = {
  name: 'stripe',

  async createCheckoutSession(params) {
    if (!stripe) {
      throw new Error('Stripe is not configured. STRIPE_SECRET_KEY is missing.');
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map((item) => ({
      price_data: {
        currency: params.currency.toLowerCase(),
        unit_amount: item.unitPrice,
        product_data: {
          name: item.title,
        },
      },
      quantity: item.quantity,
    }));

    if (params.shippingAmount > 0) {
      lineItems.push({
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: params.shippingAmount,
          product_data: {
            name: 'Studio Shipping & Delivery',
          },
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: params.customerEmail,
      line_items: lineItems,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
      },
    });

    return {
      checkoutUrl: session.url || '',
      paymentIntentId: (session.payment_intent as string) || session.id,
    };
  },

  async verifyWebhook(rawBody: string, signature: string) {
    if (!stripe || !stripeWebhookSecret) {
      return { isValid: false, eventType: 'unconfigured' };
    }

    try {
      const event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          isValid: true,
          eventType: event.type,
          orderId: session.metadata?.orderId,
          paymentIntentId: (session.payment_intent as string) || session.id,
        };
      }
      return { isValid: true, eventType: event.type };
    } catch {
      return { isValid: false, eventType: 'signature_verification_failed' };
    }
  },
};

/**
 * Built-in Test / Mock Payment Provider
 * Allows full end-to-end checkout & webhook simulation locally without needing real external test keys
 */
export const testPaymentProvider: PaymentProvider = {
  name: 'mock_test',

  async createCheckoutSession(params) {
    const testSessionId = `test_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const checkoutUrl = `/checkout/mock-gateway?orderId=${params.orderId}&session=${testSessionId}`;
    return {
      checkoutUrl,
      paymentIntentId: testSessionId,
    };
  },

  async verifyWebhook(rawBody: string, signature: string) {
    try {
      const data = JSON.parse(rawBody);
      // Validated test signature header
      if (signature === 'test_mode_valid_signature_2026') {
        return {
          isValid: true,
          eventType: 'payment.succeeded',
          orderId: data.orderId,
          paymentIntentId: data.paymentIntentId,
        };
      }
      return { isValid: false, eventType: 'invalid_signature' };
    } catch {
      return { isValid: false, eventType: 'malformed_json' };
    }
  },
};

export function getPaymentProvider(): PaymentProvider {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    return stripeProvider;
  }
  return testPaymentProvider;
}
