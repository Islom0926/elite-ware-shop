import { Hono } from 'hono';
import type { OrderStatus } from '@tma-shop/shared';
import type { AppBindings } from '../context.js';
import type { Database } from '../db/client.js';
import type { InitDataUser } from '../auth/init-data.js';
import { listRequiredChannels } from '../services/channels.js';
import {
  getAdminContactUsername,
  getUser,
  isAdminTelegramId,
  setUserPhone,
  upsertUser,
} from '../services/users.js';
import { confirmOrderPaidManually, listAllOrders, setOrderStatus } from '../services/orders.js';
import {
  answerCallbackQuery,
  editTelegramCaption,
  editTelegramMessage,
  formatTelegramAmount,
  isChannelMember,
  requestContact,
  sendTelegramMessage,
  type InlineKeyboard,
} from '../telegram/bot.js';

interface TelegramFrom {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramUpdate {
  message?: {
    message_id: number;
    chat: { id: number };
    from?: TelegramFrom;
    text?: string;
    contact?: { phone_number: string; user_id?: number };
  };
  callback_query?: {
    id: string;
    data?: string;
    from: TelegramFrom;
    message?: { chat: { id: number }; message_id: number };
  };
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Kutilmoqda',
  awaiting_payment: 'Tasdiqlanishi kutilmoqda',
  paid: "To'langan",
  cancelled: 'Bekor qilingan',
  fulfilled: 'Bajarilgan',
  in_delivery: 'Yetkazishda',
  accepted: 'Qabul qilindi',
  in_china: 'Xitoyda',
  at_china_border: 'Xitoy chegarasida',
  at_warehouse: 'Bosh omborda',
  shipped: "Jo'natib yuborildi",
  delivered: 'Yetkazib berildi',
};

function toInitDataUser(from: TelegramFrom): InitDataUser {
  return {
    id: from.id,
    first_name: from.first_name,
    ...(from.last_name !== undefined ? { last_name: from.last_name } : {}),
    ...(from.username !== undefined ? { username: from.username } : {}),
    ...(from.language_code !== undefined ? { language_code: from.language_code } : {}),
    ...(from.is_premium !== undefined ? { is_premium: from.is_premium } : {}),
  };
}

async function buildMenu(
  db: Database,
  miniappUrl: string | undefined,
  userId: number,
): Promise<{ text: string; keyboard: InlineKeyboard }> {
  const keyboard: InlineKeyboard = [];
  if (miniappUrl) {
    keyboard.push([{ text: '🛍 Do‘konni ochish', web_app: { url: miniappUrl } }]);
    keyboard.push([{ text: '📦 Buyurtmalarim', web_app: { url: `${miniappUrl}#/orders` } }]);
  }
  if (await isAdminTelegramId(db, userId)) {
    keyboard.push([{ text: '📋 Buyurtmalar ro‘yxati', callback_data: 'list_orders' }]);
  }
  const adminUsername = await getAdminContactUsername(db);
  if (adminUsername) {
    keyboard.push([{ text: '✉️ Admin bilan bog‘lanish', url: `https://t.me/${adminUsername}` }]);
  }
  return { text: 'Xush kelibsiz! Quyidagilardan birini tanlang:', keyboard };
}

async function missingChannels(
  botToken: string,
  db: Database,
  shopId: string,
  userId: number,
): Promise<{ username: string; title: string }[]> {
  const channels = await listRequiredChannels(db, shopId);
  if (channels.length === 0) return [];
  const checks = await Promise.all(
    channels.map(async (ch) => ({
      ch,
      member: await isChannelMember(botToken, ch.username, userId),
    })),
  );
  return checks
    .filter((c) => !c.member)
    .map((c) => ({ username: c.ch.username, title: c.ch.title }));
}

function subscribeGateMessage(missing: { username: string; title: string }[]): {
  text: string;
  keyboard: InlineKeyboard;
} {
  const keyboard: InlineKeyboard = missing.map((ch) => [
    { text: `➕ ${ch.title}`, url: `https://t.me/${ch.username}` },
  ]);
  keyboard.push([{ text: '✅ Tekshirish', callback_data: 'check_subscription' }]);
  return {
    text: 'Botdan foydalanish uchun avval quyidagi kanal(lar)ga obuna bo‘ling:',
    keyboard,
  };
}

/** Shows the subscribe gate if needed, otherwise the normal menu. */
async function proceedPastChannelGate(
  botToken: string,
  db: Database,
  shopId: string,
  chatId: number,
  userId: number,
  miniappUrl: string | undefined,
): Promise<void> {
  const missing = await missingChannels(botToken, db, shopId, userId);
  if (missing.length > 0) {
    const { text, keyboard } = subscribeGateMessage(missing);
    await sendTelegramMessage(botToken, chatId, text, keyboard);
  } else {
    const { text, keyboard } = await buildMenu(db, miniappUrl, userId);
    await sendTelegramMessage(botToken, chatId, text, keyboard);
  }
}

async function sendOrdersList(
  botToken: string,
  db: Database,
  shopId: string,
  chatId: number,
): Promise<void> {
  const orders = (await listAllOrders(db, shopId)).slice(0, 15);
  if (orders.length === 0) {
    await sendTelegramMessage(botToken, chatId, 'Hali buyurtmalar yo‘q.');
    return;
  }
  const buyers = new Map<number, Awaited<ReturnType<typeof getUser>>>();
  for (const order of orders) {
    if (!buyers.has(order.userId)) buyers.set(order.userId, await getUser(db, order.userId));
  }
  const lines = orders.map((order) => {
    const buyer = buyers.get(order.userId);
    const buyerLabel = buyer
      ? `${[buyer.firstName, buyer.lastName].filter(Boolean).join(' ')}${buyer.username ? ` (@${buyer.username})` : ''}`
      : String(order.userId);
    const titles = order.items.map((i) => i.title).join(', ');
    return (
      `#${order.id.slice(0, 8)} — <b>${STATUS_LABEL[order.status]}</b>\n` +
      `${titles}\n` +
      `💰 ${formatTelegramAmount(order.total, order.currency)}\n` +
      `👤 ${buyerLabel}\n` +
      `📍 ${order.deliveryAddress ?? '—'}`
    );
  });
  await sendTelegramMessage(
    botToken,
    chatId,
    `📋 <b>So‘nggi buyurtmalar (${orders.length})</b>\n\n${lines.join('\n\n')}`,
  );
}

async function handleOrderDecision(
  botToken: string,
  db: Database,
  shopId: string,
  adminId: number,
  cq: NonNullable<TelegramUpdate['callback_query']>,
  decision: 'confirm' | 'reject',
  orderId: string,
): Promise<void> {
  const chatId = cq.message?.chat.id;
  const messageId = cq.message?.message_id;
  if (chatId === undefined || messageId === undefined) return;

  if (!(await isAdminTelegramId(db, adminId))) {
    await answerCallbackQuery(botToken, cq.id, 'Siz admin emassiz');
    return;
  }

  const order =
    decision === 'confirm'
      ? await confirmOrderPaidManually(db, shopId, orderId, adminId)
      : await setOrderStatus(db, shopId, orderId, 'cancelled');

  await answerCallbackQuery(
    botToken,
    cq.id,
    decision === 'confirm' ? 'To‘lov tasdiqlandi' : 'Chek rad etildi',
  );
  await editTelegramCaption(
    botToken,
    chatId,
    messageId,
    `🧾 Buyurtma #${order.id.slice(0, 8)}\n` +
      `${decision === 'confirm' ? '✅ Tasdiqlandi' : '❌ Rad etildi'} — <b>${STATUS_LABEL[order.status]}</b>`,
  );
}

export function telegramRoutes(): Hono<AppBindings> {
  const app = new Hono<AppBindings>();

  app.post('/webhook', async (c) => {
    const env = c.get('env');
    if (env.TELEGRAM_WEBHOOK_SECRET) {
      const header = c.req.header('X-Telegram-Bot-Api-Secret-Token');
      if (header !== env.TELEGRAM_WEBHOOK_SECRET) return c.body(null, 401);
    }

    const update = await c.req.json<TelegramUpdate>().catch(() => null);
    if (!update) return c.json({ ok: true });

    const db = c.get('db');
    const shopId = c.get('shopId');
    const botToken = env.BOT_TOKEN;

    if (update.message?.contact && update.message.from) {
      const from = update.message.from;
      await upsertUser(db, toInitDataUser(from), env.ADMIN_TELEGRAM_IDS);
      await setUserPhone(db, from.id, update.message.contact.phone_number);
      await sendTelegramMessage(botToken, update.message.chat.id, 'Rahmat! ✅');
      await proceedPastChannelGate(
        botToken,
        db,
        shopId,
        update.message.chat.id,
        from.id,
        env.MINIAPP_URL,
      );
    } else if (update.message?.text === '/start' && update.message.from) {
      const from = update.message.from;
      const user = await upsertUser(db, toInitDataUser(from), env.ADMIN_TELEGRAM_IDS);

      if (!user.phone) {
        await requestContact(
          botToken,
          update.message.chat.id,
          'Davom etish uchun ism-familiyangiz va telefon raqamingizni ulashing 👇',
          '📱 Raqamni yuborish',
        );
      } else {
        await proceedPastChannelGate(
          botToken,
          db,
          shopId,
          update.message.chat.id,
          from.id,
          env.MINIAPP_URL,
        );
      }
    } else if (update.message?.text === '/orders' && update.message.from) {
      if (await isAdminTelegramId(db, update.message.from.id)) {
        await sendOrdersList(botToken, db, shopId, update.message.chat.id);
      }
    } else if (
      update.callback_query?.data === 'check_subscription' &&
      update.callback_query.message
    ) {
      const cq = update.callback_query;
      const chatId = cq.message?.chat.id as number;
      const messageId = cq.message?.message_id as number;
      const missing = await missingChannels(botToken, db, shopId, cq.from.id);
      if (missing.length > 0) {
        await answerCallbackQuery(botToken, cq.id, 'Hali barcha kanallarga obuna bo‘lmagansiz');
        const { text, keyboard } = subscribeGateMessage(missing);
        await editTelegramMessage(botToken, chatId, messageId, text, keyboard);
      } else {
        await answerCallbackQuery(botToken, cq.id, 'Rahmat!');
        const { text, keyboard } = await buildMenu(db, env.MINIAPP_URL, cq.from.id);
        await editTelegramMessage(botToken, chatId, messageId, text, keyboard);
      }
    } else if (update.callback_query?.data === 'list_orders') {
      const cq = update.callback_query;
      if (await isAdminTelegramId(db, cq.from.id)) {
        await answerCallbackQuery(botToken, cq.id);
        await sendOrdersList(botToken, db, shopId, cq.message?.chat.id ?? cq.from.id);
      } else {
        await answerCallbackQuery(botToken, cq.id, 'Siz admin emassiz');
      }
    } else if (update.callback_query && update.callback_query.data?.startsWith('confirm_order:')) {
      const cq = update.callback_query;
      const orderId = cq.data?.slice('confirm_order:'.length) ?? '';
      await handleOrderDecision(botToken, db, shopId, cq.from.id, cq, 'confirm', orderId);
    } else if (update.callback_query && update.callback_query.data?.startsWith('reject_order:')) {
      const cq = update.callback_query;
      const orderId = cq.data?.slice('reject_order:'.length) ?? '';
      await handleOrderDecision(botToken, db, shopId, cq.from.id, cq, 'reject', orderId);
    }

    return c.json({ ok: true });
  });

  return app;
}
