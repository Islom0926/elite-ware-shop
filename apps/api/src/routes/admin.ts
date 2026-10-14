import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  orderStatus,
  productInput,
  setUserRoleRequest,
  slug,
  updateShopSettingsRequest,
} from '@tma-shop/shared';
import type { AppBindings } from '../context.js';
import { requireAdmin, requireAuth } from '../auth/middleware.js';
import { createCategory, createProduct, deleteProduct, updateProduct } from '../services/admin.js';
import { confirmOrderPaidManually, listAllOrders, setOrderStatus } from '../services/orders.js';
import { updateShopSettings } from '../services/shop.js';
import { listUsers, setUserRole } from '../services/users.js';
import { ApiError } from '../lib/errors.js';

const idParam = z.object({ id: z.uuid() });
const telegramIdParam = z.object({ telegramId: z.coerce.number().int().positive() });
const categoryInput = z.object({
  slug,
  title: z.string().min(1).max(128),
  sortOrder: z.number().int().default(0),
});
const statusInput = z.object({ status: orderStatus });

export function adminRoutes(): Hono<AppBindings> {
  const app = new Hono<AppBindings>();
  app.use('*', requireAuth, requireAdmin);

  // Products
  app.post('/products', zValidator('json', productInput), async (c) =>
    c.json(await createProduct(c.get('db'), c.get('shopId'), c.req.valid('json')), 201),
  );
  app.put(
    '/products/:id',
    zValidator('param', idParam),
    zValidator('json', productInput),
    async (c) =>
      c.json(
        await updateProduct(
          c.get('db'),
          c.get('shopId'),
          c.req.valid('param').id,
          c.req.valid('json'),
        ),
      ),
  );
  app.delete('/products/:id', zValidator('param', idParam), async (c) => {
    await deleteProduct(c.get('db'), c.get('shopId'), c.req.valid('param').id);
    return c.body(null, 204);
  });

  // Categories
  app.post('/categories', zValidator('json', categoryInput), async (c) =>
    c.json(await createCategory(c.get('db'), c.get('shopId'), c.req.valid('json')), 201),
  );

  // Shop settings (manual payment card details)
  app.patch('/shop', zValidator('json', updateShopSettingsRequest), async (c) =>
    c.json(await updateShopSettings(c.get('db'), c.get('shopId'), c.req.valid('json'))),
  );

  // Orders
  app.get('/orders', async (c) => c.json(await listAllOrders(c.get('db'), c.get('shopId'))));
  app.patch(
    '/orders/:id',
    zValidator('param', idParam),
    zValidator('json', statusInput),
    async (c) => {
      const { status } = c.req.valid('json');
      const { id } = c.req.valid('param');
      const order =
        status === 'paid'
          ? await confirmOrderPaidManually(c.get('db'), c.get('shopId'), id, c.get('claims').sub)
          : await setOrderStatus(c.get('db'), c.get('shopId'), id, status);
      return c.json(order);
    },
  );

  // Admin management
  app.get('/users', async (c) => c.json(await listUsers(c.get('db'))));
  app.patch(
    '/users/:telegramId/role',
    zValidator('param', telegramIdParam),
    zValidator('json', setUserRoleRequest),
    async (c) => {
      const { telegramId } = c.req.valid('param');
      if (telegramId === c.get('claims').sub) {
        throw ApiError.badRequest('cannot_change_own_role', 'You cannot change your own role');
      }
      return c.json(await setUserRole(c.get('db'), telegramId, c.req.valid('json').role));
    },
  );

  return app;
}
