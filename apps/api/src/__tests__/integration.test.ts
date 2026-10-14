import { createHmac } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { Pool } from 'pg';
import { createApp } from '../app.js';
import type { Env } from '../config/env.js';
import { createDb, createPool, type Database } from '../db/client.js';
import { categories, products, shops } from '../db/schema.js';

/**
 * Full-stack integration test against a real Postgres. Skipped automatically
 * when TEST_DATABASE_URL is not set (e.g. a plain `npm test` with no database);
 * CI provides a Postgres service and sets the variable.
 */
const DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeDb = DATABASE_URL ? describe : describe.skip;

const BOT_TOKEN = '7654321:AAFakeBotTokenForIntegration_0123456789';
const ADMIN_ID = 706626062;
const CUSTOMER_ID = 555000111;

function signInitData(userId: number, firstName: string): string {
  const fields: Record<string, string> = {
    user: JSON.stringify({ id: userId, first_name: firstName }),
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: 'AAItest',
  };
  const dcs = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hash = createHmac('sha256', secret).update(dcs).digest('hex');
  return new URLSearchParams({ ...fields, hash }).toString();
}

describeDb('API integration', () => {
  let pool: Pool;
  let db: Database;
  let app: ReturnType<typeof createApp>;
  let shopId: string;
  let productId: string;

  beforeAll(async () => {
    pool = createPool(DATABASE_URL as string);
    db = createDb(pool);
    await migrate(db, { migrationsFolder: './drizzle' });

    // Clean slate, then seed one shop / category / product deterministically.
    await db.delete(shops);
    const [shop] = await db
      .insert(shops)
      .values({
        name: 'Test Shop',
        description: '',
        currency: 'XTR',
        cardNumber: '8600 0000 0000 0000',
        cardHolder: 'TEST SHOP',
      })
      .returning();
    shopId = shop!.id;
    const [cat] = await db
      .insert(categories)
      .values({ shopId, slug: 'tea', title: 'Tea', sortOrder: 1 })
      .returning();
    const [product] = await db
      .insert(products)
      .values({
        shopId,
        categoryId: cat!.id,
        slug: 'sencha',
        title: 'Sencha',
        description: 'Green tea',
        price: 150,
        currency: 'XTR',
        stock: 10,
        isActive: true,
      })
      .returning();
    productId = product!.id;

    const env: Env = {
      PORT: 0,
      DATABASE_URL: DATABASE_URL as string,
      BOT_TOKEN,
      JWT_SECRET: 'integration-secret-32-characters-long',
      JWT_TTL_SECONDS: 3600,
      INITDATA_MAX_AGE_SECONDS: 86_400,
      ADMIN_TELEGRAM_IDS: [ADMIN_ID],
      SHOP_ID: shopId,
      CORS_ORIGIN: '*',
    };
    app = createApp({ env, db });
  });

  afterAll(async () => {
    await pool?.end();
  });

  async function authToken(userId: number, name: string): Promise<string> {
    const res = await app.request('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData: signInitData(userId, name) }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string };
    return body.token;
  }

  it('rejects auth with tampered initData', async () => {
    const bad = signInitData(CUSTOMER_ID, 'Eve').replace('Eve', 'Mallory');
    const res = await app.request('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData: bad }),
    });
    expect(res.status).toBe(401);
  });

  it('lists catalog publicly', async () => {
    const res = await app.request('/api/products');
    expect(res.status).toBe(200);
    const page = (await res.json()) as { items: unknown[]; total: number };
    expect(page.total).toBeGreaterThanOrEqual(1);
  });

  it('runs the cart → order → manual payment flow', async () => {
    const token = await authToken(CUSTOMER_ID, 'Alice');
    const auth = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };

    // Add to cart
    const add = await app.request('/api/cart/items', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ productId, quantity: 2 }),
    });
    expect(add.status).toBe(200);
    const cart = (await add.json()) as { total: number; itemCount: number };
    expect(cart.total).toBe(300);
    expect(cart.itemCount).toBe(2);

    // Create order
    const create = await app.request('/api/orders', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({}),
    });
    expect(create.status).toBe(201);
    const { orderId } = (await create.json()) as { orderId: string };

    // Order is pending
    const before = await app.request(`/api/orders/${orderId}`, { headers: auth });
    expect(((await before.json()) as { status: string }).status).toBe('pending');

    // Customer submits a payment receipt
    const receipt = await app.request(`/api/orders/${orderId}/receipt`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ imageData: 'data:image/png;base64,aGVsbG8=' }),
    });
    expect(receipt.status).toBe(200);
    expect(((await receipt.json()) as { status: string }).status).toBe('awaiting_payment');

    // Admin confirms the payment
    const adminToken = await authToken(ADMIN_ID, 'Ivan');
    const confirm = await app.request(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    });
    expect(confirm.status).toBe(200);
    const confirmed = (await confirm.json()) as { status: string; confirmedBy: number };
    expect(confirmed.status).toBe('paid');
    expect(confirmed.confirmedBy).toBe(ADMIN_ID);

    // Order is now paid, stock decremented 10 → 8
    const after = await app.request(`/api/orders/${orderId}`, { headers: auth });
    expect(((await after.json()) as { status: string }).status).toBe('paid');
    const prod = await app.request(`/api/products/${productId}`);
    expect(((await prod.json()) as { stock: number }).stock).toBe(8);
  });

  it('manages admin roles', async () => {
    const adminToken = await authToken(ADMIN_ID, 'Ivan');
    const adminAuth = { Authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' };

    // Customer must exist (signed in at least once) before being promoted
    await authToken(CUSTOMER_ID, 'Alice');

    const promote = await app.request(`/api/admin/users/${CUSTOMER_ID}/role`, {
      method: 'PATCH',
      headers: adminAuth,
      body: JSON.stringify({ role: 'admin' }),
    });
    expect(promote.status).toBe(200);
    expect(((await promote.json()) as { role: string }).role).toBe('admin');

    const list = await app.request('/api/admin/users', { headers: adminAuth });
    expect(list.status).toBe(200);
    const users = (await list.json()) as { telegramId: number; role: string }[];
    expect(users.some((u) => u.telegramId === CUSTOMER_ID && u.role === 'admin')).toBe(true);

    // Cannot demote the only other admin down to zero... but there are two admins now,
    // so demoting the customer back is fine.
    const demote = await app.request(`/api/admin/users/${CUSTOMER_ID}/role`, {
      method: 'PATCH',
      headers: adminAuth,
      body: JSON.stringify({ role: 'customer' }),
    });
    expect(demote.status).toBe(200);

    // Cannot change your own role
    const self = await app.request(`/api/admin/users/${ADMIN_ID}/role`, {
      method: 'PATCH',
      headers: adminAuth,
      body: JSON.stringify({ role: 'customer' }),
    });
    expect(self.status).toBe(400);
  });

  it('applies a promo code at checkout and enforces its usage limit', async () => {
    const adminToken = await authToken(ADMIN_ID, 'Ivan');
    const adminAuth = { Authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' };
    const customerToken = await authToken(CUSTOMER_ID, 'Alice');
    const customerAuth = {
      Authorization: `Bearer ${customerToken}`,
      'content-type': 'application/json',
    };

    const createPromo = await app.request('/api/admin/promo-codes', {
      method: 'POST',
      headers: adminAuth,
      body: JSON.stringify({ code: 'sale10', discountPercent: 10, maxUses: 1 }),
    });
    expect(createPromo.status).toBe(201);

    await app.request('/api/cart/items', {
      method: 'POST',
      headers: customerAuth,
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    const preview = await app.request('/api/orders/promo-preview', {
      method: 'POST',
      headers: customerAuth,
      body: JSON.stringify({ code: 'SALE10' }),
    });
    expect(preview.status).toBe(200);
    const previewBody = (await preview.json()) as { discountAmount: number; total: number };
    expect(previewBody.discountAmount).toBe(15);
    expect(previewBody.total).toBe(135);

    const create = await app.request('/api/orders', {
      method: 'POST',
      headers: customerAuth,
      body: JSON.stringify({ promoCode: 'SALE10' }),
    });
    expect(create.status).toBe(201);
    const { orderId } = (await create.json()) as { orderId: string };
    const order = await app.request(`/api/orders/${orderId}`, { headers: customerAuth });
    const orderBody = (await order.json()) as {
      total: number;
      discountAmount: number;
      promoCode: string;
    };
    expect(orderBody.total).toBe(135);
    expect(orderBody.discountAmount).toBe(15);
    expect(orderBody.promoCode).toBe('SALE10');

    // maxUses was 1 — a second redemption is rejected
    await app.request('/api/cart/items', {
      method: 'POST',
      headers: customerAuth,
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const secondUse = await app.request('/api/orders', {
      method: 'POST',
      headers: customerAuth,
      body: JSON.stringify({ promoCode: 'SALE10' }),
    });
    expect(secondUse.status).toBe(400);
  });

  it('manages categories and the customer profile', async () => {
    const adminToken = await authToken(ADMIN_ID, 'Ivan');
    const adminAuth = { Authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' };

    const createCat = await app.request('/api/admin/categories', {
      method: 'POST',
      headers: adminAuth,
      body: JSON.stringify({ slug: 'accessories', title: 'Accessories', sortOrder: 2 }),
    });
    expect(createCat.status).toBe(201);
    const category = (await createCat.json()) as { id: string };

    const rename = await app.request(`/api/admin/categories/${category.id}`, {
      method: 'PUT',
      headers: adminAuth,
      body: JSON.stringify({ slug: 'accessories', title: 'Gear', sortOrder: 2 }),
    });
    expect(rename.status).toBe(200);
    expect(((await rename.json()) as { title: string }).title).toBe('Gear');

    const del = await app.request(`/api/admin/categories/${category.id}`, {
      method: 'DELETE',
      headers: adminAuth,
    });
    expect(del.status).toBe(204);

    const customerToken = await authToken(CUSTOMER_ID, 'Alice');
    const customerAuth = { Authorization: `Bearer ${customerToken}` };

    const setAddress = await app.request('/api/profile/address', {
      method: 'PATCH',
      headers: { ...customerAuth, 'content-type': 'application/json' },
      body: JSON.stringify({ address: 'Tashkent, Amir Temur 1' }),
    });
    expect(setAddress.status).toBe(200);
    expect(((await setAddress.json()) as { address: string }).address).toBe(
      'Tashkent, Amir Temur 1',
    );

    const rank = await app.request('/api/profile/rank', { headers: customerAuth });
    expect(rank.status).toBe(200);
    const rankBody = (await rank.json()) as { rank: number | null; ordersCount: number };
    expect(rankBody.rank).toBe(1);
    expect(rankBody.ordersCount).toBeGreaterThanOrEqual(1);
  });

  it('enforces admin-only routes', async () => {
    const customer = await authToken(CUSTOMER_ID, 'Alice');
    const denied = await app.request('/api/admin/orders', {
      headers: { Authorization: `Bearer ${customer}` },
    });
    expect(denied.status).toBe(403);

    const admin = await authToken(ADMIN_ID, 'Ivan');
    const allowed = await app.request('/api/admin/orders', {
      headers: { Authorization: `Bearer ${admin}` },
    });
    expect(allowed.status).toBe(200);
  });
});
