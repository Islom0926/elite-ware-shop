/**
 * Minimal outbound Telegram Bot API client, used only to push notifications
 * (new orders, payment receipts) to admins' own chat with the bot. There is
 * no webhook/inbound handling here — payment itself stays the manual
 * card-transfer flow in the miniapp.
 */

const TELEGRAM_API = 'https://api.telegram.org';

function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Not a base64 data URL');
  const [, mimeType, base64] = match;
  const bytes = Buffer.from(base64 as string, 'base64');
  return new Blob([bytes], { type: mimeType });
}

async function callTelegram(
  botToken: string,
  method: string,
  body: string | FormData,
  isJson: boolean,
): Promise<void> {
  const init: RequestInit = { method: 'POST', body };
  if (isJson) init.headers = { 'Content-Type': 'application/json' };
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/${method}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`Telegram ${method} failed (${res.status}): ${text}`);
  }
}

/** Sends a plain text notification to a single chat (best-effort, never throws). */
export async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
): Promise<void> {
  try {
    await callTelegram(
      botToken,
      'sendMessage',
      JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      true,
    );
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
  }
}

/** Sends a photo (data URL) with a caption to a single chat (best-effort, never throws). */
export async function sendTelegramPhoto(
  botToken: string,
  chatId: number,
  photoDataUrl: string,
  caption: string,
): Promise<void> {
  try {
    const form = new FormData();
    form.set('chat_id', String(chatId));
    form.set('caption', caption);
    form.set('parse_mode', 'HTML');
    form.set('photo', dataUrlToBlob(photoDataUrl), 'receipt.jpg');
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
): Promise<void> {
  await Promise.all(adminIds.map((id) => sendTelegramPhoto(botToken, id, photoDataUrl, caption)));
}
