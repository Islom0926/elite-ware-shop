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

/** Line item snapshot — title and price are frozen at order time. */
export const orderItem = z.object({
  productId: id,
  title: z.string().min(1).max(256),
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
  /** Telegram payment charge id once paid (unused for manual payments). */
  paymentChargeId: z.string().nullable(),
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
