import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { CreateOrderResponse } from '@tma-shop/shared';
import { applyPromoRequest, createOrderRequest, submitReceiptRequest } from '@tma-shop/shared';
import type { AppBindings } from '../context.js';
import { requireAuth } from '../auth/middleware.js';
import {
  createOrderFromCart,
  getOrder,
  listOrders,
  previewPromoCode,
  submitOrderReceipt,
} from '../services/orders.js';
import { ApiError } from '../lib/errors.js';

const idParam = z.object({ id: z.uuid() });

export function orderRoutes(): Hono<AppBindings> {
  const app = new Hono<AppBindings>();
  app.use('*', requireAuth);

  app.post('/', zValidator('json', createOrderRequest), async (c) => {
    const { sub } = c.get('claims');
    const { promoCode } = c.req.valid('json');
    const order = await createOrderFromCart(c.get('db'), c.get('shopId'), sub, promoCode);
    const response: CreateOrderResponse = { orderId: order.id };
    return c.json(response, 201);
  });

  app.post('/promo-preview', zValidator('json', applyPromoRequest), async (c) => {
    const { sub } = c.get('claims');
    const preview = await previewPromoCode(
      c.get('db'),
      c.get('shopId'),
      sub,
      c.req.valid('json').code,
    );
    return c.json(preview);
  });

  app.get('/', async (c) => {
    const { sub } = c.get('claims');
    return c.json(await listOrders(c.get('db'), c.get('shopId'), sub));
  });

  app.get('/:id', zValidator('param', idParam), async (c) => {
    const { sub } = c.get('claims');
    const order = await getOrder(c.get('db'), c.get('shopId'), c.req.valid('param').id, sub);
    if (!order) throw ApiError.notFound('Order not found');
    return c.json(order);
  });

  app.post(
    '/:id/receipt',
    zValidator('param', idParam),
    zValidator('json', submitReceiptRequest),
    async (c) => {
      const { sub } = c.get('claims');
      const order = await submitOrderReceipt(
        c.get('db'),
        c.get('shopId'),
        c.req.valid('param').id,
        sub,
        c.req.valid('json').imageData,
      );
      return c.json(order);
    },
  );

  return app;
}
