import { and, desc, eq, isNull, lt, or, sql } from 'drizzle-orm';
import type { Order, PromoPreview } from '@tma-shop/shared';
import type { Database, DbClient } from '../db/client.js';
import { cartItems, orderItems, orders, products, promoCodes, shops } from '../db/schema.js';
import { toOrderDTO } from '../db/mappers.js';
import { computeDiscount, findRedeemablePromoCode } from './promo.js';
import { ApiError } from '../lib/errors.js';

type OrderItemRow = typeof orderItems.$inferSelect;

export interface DraftLine {
  productId: string;
  title: string;
  imageUrl: string | null;
  selectedColor: string | null;
  selectedSize: string | null;
  unitPrice: number;
  quantity: number;
  /** `null` when not stock-tracked. */
  stock: number | null;
}

export interface OrderDraft {
  items: Array<{
    productId: string;
    title: string;
    imageUrl: string | null;
    selectedColor: string | null;
    selectedSize: string | null;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  total: number;
}

/**
 * Pure helper: turns resolved cart lines into a priced order draft, validating
 * that the cart is non-empty and every tracked line is within stock. Extracted
 * so the pricing/validation rules can be unit-tested without a database.
 */
export function buildOrderDraft(lines: DraftLine[]): OrderDraft {
  if (lines.length === 0) {
    throw ApiError.badRequest('empty_cart', 'Cannot create an order from an empty cart');
  }
  const items = lines.map((line) => {
    if (line.quantity <= 0) {
      throw ApiError.badRequest('invalid_quantity', `Invalid quantity for "${line.title}"`);
    }
    if (line.stock !== null && line.quantity > line.stock) {
      throw ApiError.conflict('out_of_stock', `Only ${line.stock} of "${line.title}" in stock`);
    }
    return {
      productId: line.productId,
      title: line.title,
      imageUrl: line.imageUrl,
      selectedColor: line.selectedColor,
      selectedSize: line.selectedSize,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      subtotal: line.unitPrice * line.quantity,
    };
  });
  return { items, total: items.reduce((sum, item) => sum + item.subtotal, 0) };
}

async function loadCartDraft(
  tx: DbClient,
  shopId: string,
  userId: number,
): Promise<{ cartId: string | null; draft: OrderDraft }> {
  const cart = await tx.query.carts.findFirst({
    where: (c, { and: andOp, eq: eqOp }) => andOp(eqOp(c.shopId, shopId), eqOp(c.userId, userId)),
  });
  const lines = cart
    ? await tx
        .select({ item: cartItems, product: products })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.cartId, cart.id))
    : [];

  const draft = buildOrderDraft(
    lines
      .filter((l) => l.product.isActive)
      .map((l) => ({
        productId: l.product.id,
        title: l.product.title,
        imageUrl: l.product.imageUrl,
        selectedColor: l.item.selectedColor || null,
        selectedSize: l.item.selectedSize || null,
        unitPrice: l.product.price,
        quantity: l.item.quantity,
        stock: l.product.stock,
      })),
  );
  return { cartId: cart?.id ?? null, draft };
}

/** Computes the discount a promo code would give on the caller's current cart. */
export async function previewPromoCode(
  db: Database,
  shopId: string,
  userId: number,
  code: string,
): Promise<PromoPreview> {
  const [{ draft }, promo] = await Promise.all([
    loadCartDraft(db, shopId, userId),
    findRedeemablePromoCode(db, shopId, code),
  ]);
  const discountAmount = computeDiscount(draft.total, promo.discountPercent);
  return {
    code: promo.code,
    discountPercent: promo.discountPercent,
    subtotal: draft.total,
    discountAmount,
    total: draft.total - discountAmount,
  };
}

/** Creates an order from the user's current cart inside a single transaction. */
export async function createOrderFromCart(
  db: Database,
  shopId: string,
  userId: number,
  promoCode?: string,
): Promise<Order> {
  return db.transaction(async (tx) => {
    const shop = await tx.query.shops.findFirst({ where: eq(shops.id, shopId) });
    if (!shop) throw ApiError.notFound('Shop not found');

    const { cartId, draft } = await loadCartDraft(tx, shopId, userId);

    let discountAmount = 0;
    let redeemedCode: string | null = null;
    if (promoCode) {
      const promo = await findRedeemablePromoCode(tx, shopId, promoCode);
      discountAmount = computeDiscount(draft.total, promo.discountPercent);
      const [redeemed] = await tx
        .update(promoCodes)
        .set({ usedCount: sql`${promoCodes.usedCount} + 1` })
        .where(
          and(
            eq(promoCodes.id, promo.id),
            eq(promoCodes.isActive, true),
            or(isNull(promoCodes.maxUses), lt(promoCodes.usedCount, promoCodes.maxUses)),
          ),
        )
        .returning({ id: promoCodes.id });
      if (!redeemed) {
        throw ApiError.badRequest(
          'promo_code_exhausted',
          'This promo code has been fully redeemed',
        );
      }
      redeemedCode = promo.code;
    }

    const [order] = await tx
      .insert(orders)
      .values({
        shopId,
        userId,
        status: 'pending',
        total: draft.total - discountAmount,
        currency: shop.currency,
        promoCode: redeemedCode,
        discountAmount,
      })
      .returning();
    if (!order) throw new Error('Failed to create order');

    await tx.insert(orderItems).values(draft.items.map((item) => ({ orderId: order.id, ...item })));
    if (cartId) await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));

    return toOrderDTO(
      order,
      draft.items.map((item) => ({ ...item, id: '', orderId: order.id })),
    );
  });
}

export async function listOrders(db: Database, shopId: string, userId: number): Promise<Order[]> {
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.shopId, shopId), eq(orders.userId, userId)))
    .orderBy(desc(orders.createdAt));
  return attachItems(db, rows);
}

export async function getOrder(
  db: Database,
  shopId: string,
  orderId: string,
  userId?: number,
): Promise<Order | undefined> {
  const filters = [eq(orders.shopId, shopId), eq(orders.id, orderId)];
  if (userId !== undefined) filters.push(eq(orders.userId, userId));
  const order = await db.query.orders.findFirst({ where: and(...filters) });
  if (!order) return undefined;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return toOrderDTO(order, items);
}

export async function listAllOrders(db: Database, shopId: string): Promise<Order[]> {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.shopId, shopId))
    .orderBy(desc(orders.createdAt));
  return attachItems(db, rows);
}

export async function setOrderStatus(
  db: Database,
  shopId: string,
  orderId: string,
  status: Order['status'],
): Promise<Order> {
  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(orders.shopId, shopId), eq(orders.id, orderId)))
    .returning();
  if (!updated) throw ApiError.notFound('Order not found');
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, updated.id));
  return toOrderDTO(updated, items);
}

/**
 * Marks an order paid and decrements tracked stock, idempotently: confirming
 * an already-paid order is a no-op. Returns the up-to-date order.
 */
export async function markOrderPaid(
  db: Database,
  orderId: string,
  confirmedBy: number,
): Promise<Order> {
  return db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) throw ApiError.notFound('Order not found');

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    if (order.status === 'paid' || order.status === 'fulfilled') {
      return toOrderDTO(order, items);
    }

    const [updated] = await tx
      .update(orders)
      .set({ status: 'paid', confirmedBy, updatedAt: new Date() })
      .where(eq(orders.id, order.id))
      .returning();
    if (!updated) throw new Error('Failed to update order');

    for (const item of items) {
      await tx
        .update(products)
        .set({ stock: sql`GREATEST(${products.stock} - ${item.quantity}, 0)` })
        .where(and(eq(products.id, item.productId), sql`${products.stock} IS NOT NULL`));
    }

    return toOrderDTO(updated, items);
  });
}

/**
 * Records a customer-submitted payment receipt and moves the order to
 * `awaiting_payment`, pending admin review. A no-op on already-settled orders.
 */
export async function submitOrderReceipt(
  db: Database,
  shopId: string,
  orderId: string,
  userId: number,
  imageData: string,
): Promise<Order> {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.shopId, shopId), eq(orders.id, orderId), eq(orders.userId, userId)),
  });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status === 'paid' || order.status === 'fulfilled' || order.status === 'cancelled') {
    throw ApiError.conflict('order_settled', 'This order can no longer accept a receipt');
  }

  const [updated] = await db
    .update(orders)
    .set({ receiptImage: imageData, status: 'awaiting_payment', updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  if (!updated) throw new Error('Failed to update order');
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return toOrderDTO(updated, items);
}

/** Admin confirms a manual payment: marks the order paid and decrements stock. */
export async function confirmOrderPaidManually(
  db: Database,
  shopId: string,
  orderId: string,
  adminTelegramId: number,
): Promise<Order> {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.shopId, shopId), eq(orders.id, orderId)),
  });
  if (!order) throw ApiError.notFound('Order not found');
  return markOrderPaid(db, orderId, adminTelegramId);
}

async function attachItems(db: Database, rows: (typeof orders.$inferSelect)[]): Promise<Order[]> {
  if (rows.length === 0) return [];
  const result: Order[] = [];
  for (const order of rows) {
    const items: OrderItemRow[] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    result.push(toOrderDTO(order, items));
  }
  return result;
}
