import { z } from 'zod';
import { id, isoDateTime } from './common.js';

/**
 * A Telegram channel customers must be subscribed to before the bot lets
 * them use the shop ("majburiy obuna" / forced-subscription gate).
 */
export const requiredChannel = z.object({
  id,
  shopId: id,
  /** Public channel username, without the leading `@`. */
  username: z.string().min(2).max(64),
  title: z.string().min(1).max(128),
  createdAt: isoDateTime,
});
export type RequiredChannel = z.infer<typeof requiredChannel>;

export const requiredChannelInput = requiredChannel.pick({ username: true, title: true });
export type RequiredChannelInput = z.infer<typeof requiredChannelInput>;
