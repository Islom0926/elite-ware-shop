import { asc, eq } from 'drizzle-orm';
import type { ShopConfig, UpdateShopSettingsRequest } from '@tma-shop/shared';
import type { Database } from '../db/client.js';
import type { Env } from '../config/env.js';
import { shops } from '../db/schema.js';
import { toShopConfigDTO } from '../db/mappers.js';
import { ApiError } from '../lib/errors.js';

/**
 * Resolves the active shop id: the configured `SHOP_ID` when present, otherwise
 * the first (and, in a single-store deployment, only) shop in the database.
 */
export async function resolveActiveShopId(db: Database, env: Env): Promise<string> {
  if (env.SHOP_ID) return env.SHOP_ID;
  const shop = await db.query.shops.findFirst({ orderBy: asc(shops.createdAt) });
  if (shop) return shop.id;

  // First boot on a fresh database: bootstrap a default shop so the API is
  // usable without a separate manual seed step.
  const [created] = await db
    .insert(shops)
    .values({
      name: 'Elite Ware Shop',
      description: 'Elite Ware Shop — clothes store.',
      currency: 'UZS',
      starsEnabled: false,
    })
    .returning();
  if (!created) throw new ApiError(503, 'no_shop', 'Failed to bootstrap a default shop');
  return created.id;
}

export async function getShopConfig(db: Database, shopId: string): Promise<ShopConfig> {
  const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
  if (!shop) throw ApiError.notFound('Shop not found');
  return toShopConfigDTO(shop);
}

export async function updateShopSettings(
  db: Database,
  shopId: string,
  input: UpdateShopSettingsRequest,
): Promise<ShopConfig> {
  const [row] = await db
    .update(shops)
    .set({
      cardNumber: input.cardNumber,
      cardHolder: input.cardHolder,
      paymentInstructions: input.paymentInstructions,
    })
    .where(eq(shops.id, shopId))
    .returning();
  if (!row) throw ApiError.notFound('Shop not found');
  return toShopConfigDTO(row);
}
