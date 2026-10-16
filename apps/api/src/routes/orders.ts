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
import { getUser } from '../services/users.js';
import {
  formatTelegramAmount,
  notifyAdmins,
  notifyAdminsWithPhoto,
  type InlineKeyboard,
} from '../telegram/bot.js';
import { ApiError } from '../lib/errors.js';

const idParam = z.object({ id: z.uuid() });

function buyerLabel(user: {
  firstName: string;
  lastName: string | null;
  username: string | null;
  phone: string | null;
}): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const handle = user.username ? ` (@${user.username})` : '';
  const phone = user.phone ? `\n📞 ${user.phone}` : '';
  return `${name}${handle}${phone}`;
}

export function orderRoutes(): Hono<AppBindings> {
  const app = new Hono<AppBindings>();
  app.use('*', requireAuth);

  app.post('/', zValidator('json', createOrderRequest), async (c) => {
    const { sub } = c.get('claims');
    const { promoCode } = c.req.valid('json');
    const db = c.get('db');
    const order = await createOrderFromCart(db, c.get('shopId'), sub, promoCode);

    const env = c.get('env');
    if (env.ADMIN_TELEGRAM_IDS.length > 0) {
      const buyer = await getUser(db, sub);
      const itemsText = order.items.map((item) => `• ${item.title} × ${item.quantity}`).join('\n');
      void notifyAdmins(
        env.BOT_TOKEN,
        env.ADMIN_TELEGRAM_IDS,
        `🆕 <b>Yangi buyurtma</b> #${order.id.slice(0, 8)}\n` +
          `${buyer ? buyerLabel(buyer) : sub}\n\n${itemsText}\n\n` +
          `Jami: <b>${formatTelegramAmount(order.total, order.currency)}</b>`,
      );
    }

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
      const db = c.get('db');
      const imageData = c.req.valid('json').imageData;
      const order = await submitOrderReceipt(
        db,
        c.get('shopId'),
        c.req.valid('param').id,
        sub,
        imageData,
      );

      const env = c.get('env');
      if (env.ADMIN_TELEGRAM_IDS.length > 0) {
        const buyer = await getUser(db, sub);
        const now = new Date();
        const keyboard: InlineKeyboard = [
          [
            { text: '✅ Tasdiqlash', callback_data: `confirm_order:${order.id}` },
            { text: '❌ Rad etish', callback_data: `reject_order:${order.id}` },
          ],
        ];
        void notifyAdminsWithPhoto(
          env.BOT_TOKEN,
          env.ADMIN_TELEGRAM_IDS,
          imageData,
          `🧾 <b>To'lov cheki</b> — buyurtma #${order.id.slice(0, 8)}\n` +
            `${buyer ? buyerLabel(buyer) : sub}\n` +
            `Sana: ${now.toLocaleDateString('uz-UZ')} ${now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}\n` +
            `Summa: <b>${formatTelegramAmount(order.total, order.currency)}</b>`,
          keyboard,
        );
      }

      return c.json(order);
    },
  );

  return app;
}
