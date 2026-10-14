import { z } from 'zod';
import { currencyCode, id, isoDateTime, moneyAmount } from './common.js';
import { telegramUserId } from './user.js';

export const orderStatus = z.enum([
  'pending', // created, not yet paid
  'awaiting_payment', // receipt submitted, waiting for admin confirmation
  'paid', // payment confirmed by admin
  'cancelled',
  'fulfilled',
]);
export type OrderStatus = z.infer<typeof orderStatus>;

/** Line item snapshot — title, price and image are frozen at order time. */
export const orderItem = z.object({
  productId: id,
  title: z.string().min(1).max(256),
  imageUrl: z.url().max(2_000_000).nullable(),
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
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Order = z.infer<typeof order>;

export const submitReceiptRequest = z.object({
  /** Data URL (e.g. `data:image/jpeg;base64,...`) of the payment screenshot. */
  imageData: z.string().min(1).max(2_000_000),
});
export type SubmitReceiptRequest = z.infer<typeof submitReceiptRequest>;
