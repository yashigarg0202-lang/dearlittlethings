import fs from 'fs';
import path from 'path';
import { formatINR } from './currency';

export { formatINR };

export interface OrderItemEmailData {
  title: string;
  variantName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number; // in minor units, e.g. 1000 = ₹10.00
  totalPrice: number;
}

export interface OrderEmailPayload {
  orderNumber: string;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  items: OrderItemEmailData[];
  subtotal: number; // in minor units
  discountAmount?: number;
  discountCode?: string;
  shippingCost: number;
  total: number;
  customerNotes?: string;
  status: string;
}

export interface EmailDispatchResult {
  success: boolean;
  provider: 'resend' | 'local_outbox';
  messageId?: string;
  filePath?: string;
  error?: string;
}

/**
 * Build professional, responsive HTML email for store owner notification
 */
export function generateOrderNotificationHtml(order: OrderEmailPayload): string {
  const addressFormatted = [
    order.shippingAddress.addressLine1,
    order.shippingAddress.addressLine2,
    `${order.shippingAddress.city} ${order.shippingAddress.postalCode}`,
    order.shippingAddress.state,
    order.shippingAddress.country,
  ]
    .filter(Boolean)
    .join(', ');

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #E5DCD3;">
        <td style="padding: 12px 8px; font-size: 14px; color: #2B231D; font-family: 'Karla', sans-serif;">
          <strong>${item.title}</strong>
          ${item.variantName && item.variantName !== 'Default Title' ? `<div style="font-size: 12px; color: #7C6D63;">${item.variantName}</div>` : ''}
          ${item.sku ? `<div style="font-size: 11px; color: #8F8075;">SKU: ${item.sku}</div>` : ''}
        </td>
        <td style="padding: 12px 8px; font-size: 14px; text-align: center; color: #2B231D; font-family: 'Karla', sans-serif;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 8px; font-size: 14px; text-align: right; color: #2B231D; font-family: 'Karla', sans-serif;">
          ${formatINR(item.unitPrice)}
        </td>
        <td style="padding: 12px 8px; font-size: 14px; text-align: right; font-weight: 600; color: #2B231D; font-family: 'Karla', sans-serif;">
          ${formatINR(item.totalPrice)}
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Request #${order.orderNumber} - ${order.customerName}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2B231D;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; margin: 0 auto; background-color: #F8F4ED; border: 1px solid #E2D7CC; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px rgba(58, 43, 36, 0.06);">
    <!-- Brand Header -->
    <tr>
      <td style="padding: 32px 32px 24px 32px; background-color: #2B231D; color: #FAF7F2; text-align: center;">
        <h1 style="margin: 0; font-family: 'Georgia', serif; font-size: 26px; font-style: italic; font-weight: normal; letter-spacing: -0.5px;">
          dear little things
        </h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #DFE5DD; letter-spacing: 0.5px;">
          NEW CUSTOMER ORDER REQUEST
        </p>
      </td>
    </tr>

    <!-- Order Alert Box -->
    <tr>
      <td style="padding: 24px 32px; border-bottom: 1px solid #E2D7CC; background-color: #F4EFEB;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #7C6D63;">Order Reference</div>
              <div style="font-size: 20px; font-weight: bold; color: #A85A44; margin-top: 2px;">#${order.orderNumber}</div>
            </td>
            <td style="text-align: right;">
              <span style="display: inline-block; padding: 4px 10px; background-color: #ECDCD7; color: #A85A44; font-size: 12px; font-weight: 600; border-radius: 999px;">
                ${order.status}
              </span>
              <div style="font-size: 12px; color: #7C6D63; margin-top: 4px;">
                ${order.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Customer Contact Card -->
    <tr>
      <td style="padding: 24px 32px; border-bottom: 1px solid #E2D7CC;">
        <h2 style="margin: 0 0 16px 0; font-family: 'Georgia', serif; font-size: 18px; color: #2B231D; font-weight: normal;">
          Customer Contact & Delivery Info
        </h2>
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px; line-height: 1.5;">
          <tr>
            <td width="130" style="color: #7C6D63;"><strong>Name:</strong></td>
            <td style="color: #2B231D;">${order.customerName}</td>
          </tr>
          <tr>
            <td style="color: #7C6D63;"><strong>Email:</strong></td>
            <td><a href="mailto:${order.customerEmail}" style="color: #A85A44; text-decoration: underline;">${order.customerEmail}</a></td>
          </tr>
          <tr>
            <td style="color: #7C6D63;"><strong>Phone / WhatsApp:</strong></td>
            <td><a href="tel:${order.customerPhone}" style="color: #A85A44; font-weight: 600; text-decoration: none;">${order.customerPhone}</a></td>
          </tr>
          <tr>
            <td style="color: #7C6D63; vertical-align: top;"><strong>Delivery Address:</strong></td>
            <td style="color: #2B231D;">${addressFormatted}</td>
          </tr>
          ${
            order.customerNotes
              ? `<tr>
                  <td style="color: #7C6D63; vertical-align: top;"><strong>Customer Notes:</strong></td>
                  <td style="background-color: #FAF6F1; padding: 8px; border-left: 3px solid #A85A44; color: #2B231D; font-style: italic;">
                    ${order.customerNotes}
                  </td>
                </tr>`
              : ''
          }
        </table>
      </td>
    </tr>

    <!-- Itemised Order Breakdown -->
    <tr>
      <td style="padding: 24px 32px;">
        <h2 style="margin: 0 0 16px 0; font-family: 'Georgia', serif; font-size: 18px; color: #2B231D; font-weight: normal;">
          Ordered Items
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #E2D7CC; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #7C6D63;">
              <th style="padding: 8px 8px;">Product</th>
              <th style="padding: 8px 8px; text-align: center;">Qty</th>
              <th style="padding: 8px 8px; text-align: right;">Unit Price</th>
              <th style="padding: 8px 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals Table -->
        <table width="100%" cellpadding="6" cellspacing="0" style="margin-top: 16px; border-top: 1px solid #E2D7CC; font-size: 14px;">
          <tr>
            <td style="color: #7C6D63;">Subtotal</td>
            <td style="text-align: right; color: #2B231D;">${formatINR(order.subtotal)}</td>
          </tr>
          ${
            order.discountAmount && order.discountAmount > 0
              ? `<tr>
                  <td style="color: #7C6D63;">Discount ${order.discountCode ? `(${order.discountCode})` : ''}</td>
                  <td style="text-align: right; color: #A85A44;">-${formatINR(order.discountAmount)}</td>
                </tr>`
              : ''
          }
          <tr>
            <td style="color: #7C6D63;">Delivery Charges</td>
            <td style="text-align: right; color: #2B231D;">${order.shippingCost === 0 ? '<span style="color: #5B7A56; font-weight: 600;">FREE</span>' : formatINR(order.shippingCost)}</td>
          </tr>
          <tr style="border-top: 2px solid #2B231D;">
            <td style="font-size: 16px; font-weight: bold; color: #2B231D; padding-top: 10px;">
              Final Order Total
            </td>
            <td style="font-size: 18px; font-weight: bold; color: #A85A44; text-align: right; padding-top: 10px;">
              ${formatINR(order.total)}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer Action Note -->
    <tr>
      <td style="padding: 24px 32px; background-color: #F4EFEB; border-top: 1px solid #E2D7CC; text-align: center; font-size: 13px; color: #7C6D63; line-height: 1.5;">
        <p style="margin: 0 0 8px 0; color: #2B231D; font-weight: 500;">
          Next step: Contact the customer to confirm their items, delivery timeline, and arrange payment.
        </p>
        <p style="margin: 0; font-size: 12px; color: #8F8075;">
          dear little things studio · Automated Order Request System
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Dispatch notification email to store owner
 * Supports Resend if RESEND_API_KEY is configured,
 * otherwise persists locally to outbox/*.html with full console feedback.
 */
export async function sendOrderNotificationEmail(
  order: OrderEmailPayload
): Promise<EmailDispatchResult> {
  const storeOwnerEmail = process.env.STORE_OWNER_EMAIL || 'yashi@dearlittlethings.studio';
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'Dear Little Things <orders@dearlittlethings.studio>';

  const subject = `New Order Request #${order.orderNumber} - ${order.customerName}`;
  const html = generateOrderNotificationHtml(order);

  // 1. Try sending via Resend API if API key is provided
  if (resendApiKey && !resendApiKey.includes('placeholder')) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [storeOwnerEmail],
          subject,
          html,
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        console.log(`[Email] Successfully delivered via Resend. ID: ${data.id}`);
        return {
          success: true,
          provider: 'resend',
          messageId: data.id,
        };
      } else {
        console.warn('[Email] Resend API response error:', data);
        // Fall through to local outbox logging so the notification is never lost
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown email API error';
      console.error('[Email] Failed to call Resend API:', msg);
      // Fall through to local outbox
    }
  }

  // 2. Safe local dispatcher: Save to outbox/ folder as .html file
  try {
    const outboxDir = path.join(process.cwd(), 'outbox');
    if (!fs.existsSync(outboxDir)) {
      fs.mkdirSync(outboxDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeOrderNum = order.orderNumber.replace(/[^a-zA-Z0-9-]/g, '_');
    const filename = `order_${safeOrderNum}_${timestamp}.html`;
    const filePath = path.join(outboxDir, filename);

    fs.writeFileSync(filePath, html, 'utf-8');

    console.log('--------------------------------------------------');
    console.log(`✉️  ORDER REQUEST NOTIFICATION DISPATCHED:`);
    console.log(`    To: ${storeOwnerEmail}`);
    console.log(`    Subject: ${subject}`);
    console.log(`    Order Reference: #${order.orderNumber}`);
    console.log(`    Customer: ${order.customerName} (${order.customerEmail})`);
    console.log(`    Saved HTML: outbox/${filename}`);
    console.log('--------------------------------------------------');

    return {
      success: true,
      provider: 'local_outbox',
      filePath: `outbox/${filename}`,
    };
  } catch (err: unknown) {
    console.error('[Email] Failed to write outbox file:', err);
    const msg = err instanceof Error ? err.message : 'Unknown outbox file error';
    return {
      success: false,
      provider: 'local_outbox',
      error: msg,
    };
  }
}
