import { z } from 'zod';
import { isoDateTime } from './common.js';

/** Telegram user id (numeric, 64-bit — kept as number to match Bot API). */
export const telegramUserId = z.number().int().positive();

export const userRole = z.enum(['customer', 'admin']);
export type UserRole = z.infer<typeof userRole>;

export const user = z.object({
  telegramId: telegramUserId,
  firstName: z.string().min(1).max(128),
  lastName: z.string().max(128).nullable(),
  username: z.string().max(64).nullable(),
  languageCode: z.string().max(8).nullable(),
  isPremium: z.boolean(),
  photoUrl: z.url().nullable(),
  role: userRole,
  address: z.string().max(512).nullable(),
  createdAt: isoDateTime,
});
export type User = z.infer<typeof user>;

/** Public-facing subset returned to the client after auth. */
export const sessionUser = user.pick({
  telegramId: true,
  firstName: true,
  lastName: true,
  username: true,
  languageCode: true,
  isPremium: true,
  photoUrl: true,
  role: true,
  address: true,
});
export type SessionUser = z.infer<typeof sessionUser>;

export const setUserRoleRequest = z.object({
  role: userRole,
});
export type SetUserRoleRequest = z.infer<typeof setUserRoleRequest>;

export const updateAddressRequest = z.object({
  address: z.string().trim().max(512).nullable(),
});
export type UpdateAddressRequest = z.infer<typeof updateAddressRequest>;

/** The customer's position on the "top spenders" leaderboard. */
export const rankInfo = z.object({
  rank: z.number().int().positive().nullable(),
  totalRanked: z.number().int().nonnegative(),
  totalSpent: z.number().int().nonnegative(),
  ordersCount: z.number().int().nonnegative(),
});
export type RankInfo = z.infer<typeof rankInfo>;
