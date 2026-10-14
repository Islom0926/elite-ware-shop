import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { updateAddressRequest } from '@tma-shop/shared';
import type { AppBindings } from '../context.js';
import { requireAuth } from '../auth/middleware.js';
import { getUserRank, updateAddress } from '../services/users.js';
import { toUserDTO } from '../db/mappers.js';
import { ApiError } from '../lib/errors.js';

export function profileRoutes(): Hono<AppBindings> {
  const app = new Hono<AppBindings>();
  app.use('*', requireAuth);

  app.get('/rank', async (c) => {
    const { sub } = c.get('claims');
    return c.json(await getUserRank(c.get('db'), c.get('shopId'), sub));
  });

  app.patch('/address', zValidator('json', updateAddressRequest), async (c) => {
    const { sub } = c.get('claims');
    const user = await updateAddress(c.get('db'), sub, c.req.valid('json').address);
    return c.json(user);
  });

  app.get('/', async (c) => {
    const { sub } = c.get('claims');
    const db = c.get('db');
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.telegramId, sub),
    });
    if (!user) throw ApiError.notFound('User not found');
    return c.json(toUserDTO(user));
  });

  return app;
}
