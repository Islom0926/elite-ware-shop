import { Hono } from 'hono';
import type { AppBindings } from '../context.js';
import type { Database } from '../db/client.js';
import { listRequiredChannels } from '../services/channels.js';
import { getAdminContactUsername, upsertUser } from '../services/users.js';
import {
  answerCallbackQuery,
  editTelegramMessage,
  isChannelMember,
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
  };
  callback_query?: {
    id: string;
    data?: string;
    from: TelegramFrom;
    message?: { chat: { id: number }; message_id: number };
  };
}

async function buildMenu(
  db: Database,
  miniappUrl: string | undefined,
): Promise<{ text: string; keyboard: InlineKeyboard }> {
  const keyboard: InlineKeyboard = [];
  if (miniappUrl) {
    keyboard.push([{ text: '🛍 Do‘konni ochish', web_app: { url: miniappUrl } }]);
    keyboard.push([{ text: '📦 Buyurtmalarim', web_app: { url: `${miniappUrl}#/orders` } }]);
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

    if (update.message?.text === '/start' && update.message.from) {
      const from = update.message.from;
      await upsertUser(
        db,
        {
          id: from.id,
          first_name: from.first_name,
          ...(from.last_name !== undefined ? { last_name: from.last_name } : {}),
          ...(from.username !== undefined ? { username: from.username } : {}),
          ...(from.language_code !== undefined ? { language_code: from.language_code } : {}),
          ...(from.is_premium !== undefined ? { is_premium: from.is_premium } : {}),
        },
        env.ADMIN_TELEGRAM_IDS,
      );

      const missing = await missingChannels(botToken, db, shopId, from.id);
      if (missing.length > 0) {
        const { text, keyboard } = subscribeGateMessage(missing);
        await sendTelegramMessage(botToken, update.message.chat.id, text, keyboard);
      } else {
        const { text, keyboard } = await buildMenu(db, env.MINIAPP_URL);
        await sendTelegramMessage(botToken, update.message.chat.id, text, keyboard);
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
        const { text, keyboard } = await buildMenu(db, env.MINIAPP_URL);
        await editTelegramMessage(botToken, chatId, messageId, text, keyboard);
      }
    }

    return c.json({ ok: true });
  });

  return app;
}
