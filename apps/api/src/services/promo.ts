import { and, eq } from 'drizzle-orm';
import type { PromoCode, PromoCodeInput } from '@tma-shop/shared';
import type { Database, DbClient } from '../db/client.js';
import { promoCodes } from '../db/schema.js';
import { toPromoCodeDTO } from '../db/mappers.js';
import { ApiError } from '../lib/errors.js';

export async function listPromoCodes(db: Database, shopId: string): Promise<PromoCode[]> {
  const rows = await db.select().from(promoCodes).where(eq(promoCodes.shopId, shopId));
  return rows.map(toPromoCodeDTO);
}

export async function createPromoCode(
  db: Database,
  shopId: string,
  input: PromoCodeInput,
): Promise<PromoCode> {
  const existing = await db.query.promoCodes.findFirst({
    where: and(eq(promoCodes.shopId, shopId), eq(promoCodes.code, input.code)),
  });
  if (existing) throw ApiError.conflict('code_exists', 'This promo code already exists');

  const [row] = await db
    .insert(promoCodes)
    .values({ shopId, ...input })
    .returning();
  if (!row) throw new Error('Failed to create promo code');
  return toPromoCodeDTO(row);
}

export async function deletePromoCode(db: Database, shopId: string, id: string): Promise<void> {
  const deleted = await db
    .delete(promoCodes)
    .where(and(eq(promoCodes.shopId, shopId), eq(promoCodes.id, id)))
    .returning({ id: promoCodes.id });
  if (deleted.length === 0) throw ApiError.notFound('Promo code not found');
}

type PromoCodeRow = typeof promoCodes.$inferSelect;

/** Looks up an active, not-yet-exhausted promo code. Throws a 400 if invalid. */
export async function findRedeemablePromoCode(
  db: DbClient,
  shopId: string,
  code: string,
): Promise<PromoCodeRow> {
  const row = await db.query.promoCodes.findFirst({
    where: and(eq(promoCodes.shopId, shopId), eq(promoCodes.code, code.trim().toUpperCase())),
  });
  if (!row || !row.isActive) {
    throw ApiError.badRequest('invalid_promo_code', 'This promo code is not valid');
  }
  if (row.maxUses !== null && row.usedCount >= row.maxUses) {
    throw ApiError.badRequest('promo_code_exhausted', 'This promo code has been fully redeemed');
  }
  return row;
}

export function computeDiscount(subtotal: number, discountPercent: number): number {
  return Math.round((subtotal * discountPercent) / 100);
}
