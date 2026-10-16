/**
 * Minimal Telegram Bot API client: outbound notifications (new orders,
 * payment receipts) to admins, plus the small set of calls the `/start`
 * webhook handler needs (inline keyboards, membership checks). Payment
 * itself stays the manual card-transfer flow in the miniapp — this is not a
 * general bot framework.
 */

const TELEGRAM_API = 'https://api.telegram.org';

/** Formats a minor-unit amount for a Telegram caption, e.g. `150 000 UZS`. */
export function formatTelegramAmount(amount: number, currency: string): string {
  return `${new Intl.NumberFormat('ru-RU').format(amount)} ${currency}`;
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  web_app?: { url: string };
  callback_data?: string;
}
export type InlineKeyboard = InlineKeyboardButton[][];

function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Not a base64 data URL');
  const [, mimeType, base64] = match;
  const bytes = Buffer.from(base64 as string, 'base64');
  return new Blob([bytes], { type: mimeType });
}

async function callTelegram<T = unknown>(
  botToken: string,
  method: string,
  body: string | FormData,
  isJson: boolean,
): Promise<T | undefined> {
  const init: RequestInit = { method: 'POST', body };
  if (isJson) init.headers = { 'Content-Type': 'application/json' };
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/${method}`, init);
  const payload = (await res.json().catch(() => null)) as { ok: boolean; result?: T } | null;
  if (!res.ok || !payload?.ok) {
    console.error(`Telegram ${method} failed (${res.status}):`, JSON.stringify(payload));
    return undefined;
  }
  return payload.result;
}

/** Sends a plain text notification to a single chat (best-effort, never throws). */
export async function sendTelegramMessage(
  botToken: string,
  chatId: number | string,
  text: string,
  replyMarkup?: InlineKeyboard,
): Promise<void> {
  try {
    await callTelegram(
      botToken,
      'sendMessage',
      JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...(replyMarkup ? { reply_markup: { inline_keyboard: replyMarkup } } : {}),
      }),
      true,
    );
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
  }
}

/** Edits an existing message's text/keyboard in place (best-effort, never throws). */
export async function editTelegramMessage(
  botToken: string,
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboard,
): Promise<void> {
  try {
    await callTelegram(
      botToken,
      'editMessageText',
      JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        ...(replyMarkup ? { reply_markup: { inline_keyboard: replyMarkup } } : {}),
      }),
      true,
    );
  } catch (err) {
    console.error('Failed to edit Telegram message:', err);
  }
}

/** Edits an existing photo message's caption/keyboard in place (best-effort, never throws). */
export async function editTelegramCaption(
  botToken: string,
  chatId: number,
  messageId: number,
  caption: string,
  replyMarkup?: InlineKeyboard,
): Promise<void> {
  try {
    await callTelegram(
      botToken,
      'editMessageCaption',
      JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        caption,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: replyMarkup ?? [] },
      }),
      true,
    );
  } catch (err) {
    console.error('Failed to edit Telegram caption:', err);
  }
}

/** Prompts the user to share their phone number via Telegram's native contact card. */
export async function requestContact(
  botToken: string,
  chatId: number,
  text: string,
  buttonText: string,
): Promise<void> {
  try {
    await callTelegram(
      botToken,
      'sendMessage',
      JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: {
          keyboard: [[{ text: buttonText, request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }),
      true,
    );
  } catch (err) {
    console.error('Failed to request Telegram contact:', err);
  }
}

/** Acknowledges a callback query (stops the client's loading spinner), optionally with a toast. */
export async function answerCallbackQuery(
  botToken: string,
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  try {
    await callTelegram(
      botToken,
      'answerCallbackQuery',
      JSON.stringify({ callback_query_id: callbackQueryId, ...(text ? { text } : {}) }),
      true,
    );
  } catch (err) {
    console.error('Failed to answer Telegram callback query:', err);
  }
}

/** Checks whether a user is a member of a public channel (by `@username`). */
export async function isChannelMember(
  botToken: string,
  channelUsername: string,
  userId: number,
): Promise<boolean> {
  try {
    const result = await callTelegram<{ status: string }>(
      botToken,
      'getChatMember',
      JSON.stringify({ chat_id: `@${channelUsername}`, user_id: userId }),
      true,
    );
    return !!result && ['member', 'administrator', 'creator'].includes(result.status);
  } catch (err) {
    console.error('Failed to check Telegram channel membership:', err);
    return false;
  }
}

/** Sends a photo (data URL) with a caption to a single chat (best-effort, never throws). */
export async function sendTelegramPhoto(
  botToken: string,
  chatId: number | string,
  photoDataUrl: string,
  caption: string,
  replyMarkup?: InlineKeyboard,
): Promise<void> {
  try {
    const form = new FormData();
    form.set('chat_id', String(chatId));
    form.set('caption', caption);
    form.set('parse_mode', 'HTML');
    form.set('photo', dataUrlToBlob(photoDataUrl), 'receipt.jpg');
    if (replyMarkup) form.set('reply_markup', JSON.stringify({ inline_keyboard: replyMarkup }));
    await callTelegram(botToken, 'sendPhoto', form, false);
  } catch (err) {
    console.error('Failed to send Telegram photo:', err);
  }
}

/** Fans a text message out to every admin chat id, in parallel, best-effort. */
export async function notifyAdmins(
  botToken: string,
  adminIds: number[],
  text: string,
): Promise<void> {
  await Promise.all(adminIds.map((id) => sendTelegramMessage(botToken, id, text)));
}

/** Fans a receipt photo out to every admin chat id, in parallel, best-effort. */
export async function notifyAdminsWithPhoto(
  botToken: string,
  adminIds: number[],
  photoDataUrl: string,
  caption: string,
  replyMarkup?: InlineKeyboard,
): Promise<void> {
  await Promise.all(
    adminIds.map((id) => sendTelegramPhoto(botToken, id, photoDataUrl, caption, replyMarkup)),
  );
}
