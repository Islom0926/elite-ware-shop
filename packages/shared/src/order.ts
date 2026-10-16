import { z } from 'zod';
import { currencyCode, id, isoDateTime, moneyAmount } from './common.js';
import { telegramUserId } from './user.js';

export const orderStatus = z.enum([
  'pending', // created, not yet paid
  'awaiting_payment', // receipt submitted, waiting for admin confirmation
  'paid', // payment confirmed by admin
  'cancelled',
  'fulfilled', // legacy terminal status, superseded by `delivered`
  'in_delivery', // legacy stage, superseded by the china/warehouse/shipped stages below
  /**
   * Post-payment fulfillment pipeline, in order:
   * accepted -> in_china -> at_china_border -> at_warehouse -> shipped -> delivered
   */
  'accepted', // admin has accepted the paid order for fulfillment
  'in_china', // sourcing/purchasing in China
  'at_china_border', // cleared to the China border, in transit to us
  'at_warehouse', // arrived at our main warehouse
  'shipped', // dispatched to the customer
  'delivered', // customer has received the order (terminal)
]);
export type OrderStatus = z.infer<typeof orderStatus>;

/** Every status that means "payment has been confirmed" (post-`paid`, through delivery). */
export const PAID_ORDER_STATUSES: readonly OrderStatus[] = [
  'paid',
  'accepted',
  'in_china',
  'at_china_border',
  'at_warehouse',
  'shipped',
  'delivered',
  'fulfilled',
];

/** Line item snapshot — title, price and image are frozen at order time. */
export const orderItem = z.object({
  productId: id,
  title: z.string().min(1).max(256),
  imageUrl: z.url().max(2_000_000).nullable(),
  selectedColor: z.string().nullable(),
  selectedSize: z.string().nullable(),
  unitPrice: moneyAmount,
  quantity: z.number().int().positive(),
  subtotal: moneyAmount,
});
export type OrderItem = z.infer<typeof orderItem>;

export const order = z.object({
  id,
  shopId: id,
  userId: telegramUserId,
  status: orderStatus,
  items: z.array(orderItem).min(1),
  total: moneyAmount,
  currency: currencyCode,
  /** Promo code applied at checkout, if any. */
  promoCode: z.string().nullable(),
  /** Amount deducted from the items subtotal by the promo code. */
  discountAmount: moneyAmount,
  /** Telegram id of the admin who confirmed the manual payment. */
  confirmedBy: telegramUserId.nullable(),
  /** Customer-submitted payment proof, as a data URL. */
  receiptImage: z.string().nullable(),
  /** Delivery address, snapshotted from the buyer's profile at checkout. */
  deliveryAddress: z.string().nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Order = z.infer<typeof order>;

export const submitReceiptRequest = z.object({
  /** Data URL (e.g. `data:image/jpeg;base64,...`) of the payment screenshot. */
  imageData: z.string().min(1).max(2_000_000),
});
export type SubmitReceiptRequest = z.infer<typeof submitReceiptRequest>;
