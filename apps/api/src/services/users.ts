import { and, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { PAID_ORDER_STATUSES, type RankInfo, type User, type UserRole } from '@tma-shop/shared';
import type { Database } from '../db/client.js';
import { orders, users } from '../db/schema.js';
import { toUserDTO } from '../db/mappers.js';
import type { InitDataUser } from '../auth/init-data.js';
import { ApiError } from '../lib/errors.js';

type UserRow = typeof users.$inferSelect;

/**
 * Inserts or updates a user from validated initData, keeping the profile fresh
 * on every login. The admin role is assigned from the configured allow-list and
 * is never downgraded by a normal login.
 */
export async function upsertUser(
  db: Database,
  tgUser: InitDataUser,
  adminIds: readonly number[],
): Promise<UserRow> {
  const isAdmin = adminIds.includes(tgUser.id);
  const profile = {
    firstName: tgUser.first_name,
    lastName: tgUser.last_name ?? null,
    username: tgUser.username ?? null,
    languageCode: tgUser.language_code ?? null,
    isPremium: tgUser.is_premium ?? false,
    photoUrl: tgUser.photo_url ?? null,
  };

  const [row] = await db
    .insert(users)
    .values({
      telegramId: tgUser.id,
      ...profile,
      role: isAdmin ? 'admin' : 'customer',
    })
    .onConflictDoUpdate({
      target: users.telegramId,
      set: {
        ...profile,
        // Promote to admin if newly allow-listed; never auto-demote here.
        ...(isAdmin ? { role: 'admin' as const } : {}),
      },
    })
    .returning();

  if (!row) throw new Error('Failed to upsert user');
  return row;
}

export async function getUser(db: Database, telegramId: number): Promise<UserRow | undefined> {
  return db.query.users.findFirst({ where: eq(users.telegramId, telegramId) });
}

/** First admin with a public `@username` the bot can link customers to. */
export async function getAdminContactUsername(db: Database): Promise<string | undefined> {
  const admin = await db.query.users.findFirst({
    where: and(eq(users.role, 'admin'), sql`${users.username} is not null`),
  });
  return admin?.username ?? undefined;
}

/** Lists every known user (anyone who has ever signed in), newest first. */
export async function listUsers(db: Database): Promise<User[]> {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));
  return rows.map(toUserDTO);
}

/**
 * Promotes or demotes a user. Refuses to demote the last remaining admin so
 * the shop never ends up with nobody able to manage it.
 */
export async function setUserRole(db: Database, telegramId: number, role: UserRole): Promise<User> {
  const target = await db.query.users.findFirst({ where: eq(users.telegramId, telegramId) });
  if (!target) throw ApiError.notFound('User not found');

  if (target.role === 'admin' && role === 'customer') {
    const [counted] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.role, 'admin'), ne(users.telegramId, telegramId)));
    if ((counted?.count ?? 0) === 0) {
      throw ApiError.badRequest('last_admin', 'Cannot demote the only remaining admin');
    }
  }

  const [row] = await db
    .update(users)
    .set({ role })
    .where(eq(users.telegramId, telegramId))
    .returning();
  if (!row) throw new Error('Failed to update user role');
  return toUserDTO(row);
}

export async function updateAddress(
  db: Database,
  telegramId: number,
  address: string | null,
): Promise<User> {
  const [row] = await db
    .update(users)
    .set({ address })
    .where(eq(users.telegramId, telegramId))
    .returning();
  if (!row) throw ApiError.notFound('User not found');
  return toUserDTO(row);
}

/**
 * The customer's position on the "top spenders" leaderboard: ranked by total
 * amount paid (paid + fulfilled orders) within the shop, highest first.
 */
export async function getUserRank(
  db: Database,
  shopId: string,
  telegramId: number,
): Promise<RankInfo> {
  const rows = await db
    .select({
      userId: orders.userId,
      totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
      ordersCount: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(and(eq(orders.shopId, shopId), inArray(orders.status, PAID_ORDER_STATUSES)))
    .groupBy(orders.userId);

  const ranked = rows.filter((r) => r.totalSpent > 0).sort((a, b) => b.totalSpent - a.totalSpent);
  const index = ranked.findIndex((r) => r.userId === telegramId);
  const mine = rows.find((r) => r.userId === telegramId);

  return {
    rank: index === -1 ? null : index + 1,
    totalRanked: ranked.length,
    totalSpent: mine?.totalSpent ?? 0,
    ordersCount: mine?.ordersCount ?? 0,
  };
}
