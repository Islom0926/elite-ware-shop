import { z } from 'zod';
import { currencyCode, id, isoDateTime } from './common.js';

/**
 * Shop configuration makes the store "universal": a single deployment is driven
 * entirely by this record (name, branding, currency). Multi-tenant support is a
 * future path — today one configured shop is active at a time.
 */
export const shop = z.object({
  id,
  name: z.string().min(1).max(128),
  description: z.string().max(1024),
  currency: currencyCode,
  /** Bank card number customers transfer manual payments to. */
  cardNumber: z.string().max(64).nullable(),
  /** Name on the bank card, shown to customers alongside the number. */
  cardHolder: z.string().max(128).nullable(),
  /** Free-form instructions shown at checkout. */
  paymentInstructions: z.string().max(1024).nullable(),
  createdAt: isoDateTime,
});
export type Shop = z.infer<typeof shop>;

export const shopConfig = shop.pick({
  id: true,
  name: true,
  description: true,
  currency: true,
  cardNumber: true,
  cardHolder: true,
  paymentInstructions: true,
});
export type ShopConfig = z.infer<typeof shopConfig>;

export const shopStats = z.object({
  /** Sum of all paid+ order totals (everything from `paid` through `delivered`). */
  totalRevenue: z.number().int().nonnegative(),
  currency: currencyCode,
  userCount: z.number().int().nonnegative(),
  orderCount: z.number().int().nonnegative(),
});
export type ShopStats = z.infer<typeof shopStats>;

export const updateShopSettingsRequest = z.object({
  cardNumber: z.string().trim().max(64).nullable(),
  cardHolder: z.string().trim().max(128).nullable(),
  paymentInstructions: z.string().trim().max(1024).nullable(),
});
export type UpdateShopSettingsRequest = z.infer<typeof updateShopSettingsRequest>;
