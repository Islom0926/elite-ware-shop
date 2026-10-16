import { and, count, eq, inArray, sql } from 'drizzle-orm';
import { PAID_ORDER_STATUSES, type ShopStats } from '@tma-shop/shared';
import type { Database } from '../db/client.js';
import { orders, shops, users } from '../db/schema.js';
import { ApiError } from '../lib/errors.js';

export async function getShopStats(db: Database, shopId: string): Promise<ShopStats> {
  const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
  if (!shop) throw ApiError.notFound('Shop not found');

  const [[revenueRow], [orderCountRow], [userCountRow]] = await Promise.all([
    db
      .select({ total: sql<string>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(and(eq(orders.shopId, shopId), inArray(orders.status, PAID_ORDER_STATUSES))),
    db.select({ n: count() }).from(orders).where(eq(orders.shopId, shopId)),
    db.select({ n: count() }).from(users),
  ]);

  return {
    totalRevenue: Number(revenueRow?.total ?? 0),
    currency: shop.currency,
    userCount: userCountRow?.n ?? 0,
    orderCount: orderCountRow?.n ?? 0,
  };
}
