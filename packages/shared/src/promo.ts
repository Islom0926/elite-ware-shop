import { z } from 'zod';
import { id, isoDateTime, moneyAmount } from './common.js';

export const promoCodeValue = z
  .string()
  .trim()
  .toUpperCase()
  .min(3)
  .max(32)
  .regex(/^[A-Z0-9_-]+$/, 'Promo code may only contain letters, digits, - and _');

export const promoCode = z.object({
  id,
  shopId: id,
  code: promoCodeValue,
  discountPercent: z.number().int().min(1).max(100),
  maxUses: z.number().int().positive().nullable(),
  usedCount: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: isoDateTime,
});
export type PromoCode = z.infer<typeof promoCode>;

export const promoCodeInput = z.object({
  code: promoCodeValue,
  discountPercent: z.number().int().min(1).max(100),
  maxUses: z.number().int().positive().nullable(),
});
export type PromoCodeInput = z.infer<typeof promoCodeInput>;

export const promoPreview = z.object({
  code: promoCodeValue,
  discountPercent: z.number().int().min(1).max(100),
  subtotal: moneyAmount,
  discountAmount: moneyAmount,
  total: moneyAmount,
});
export type PromoPreview = z.infer<typeof promoPreview>;

export const applyPromoRequest = z.object({
  code: promoCodeValue,
});
export type ApplyPromoRequest = z.infer<typeof applyPromoRequest>;
