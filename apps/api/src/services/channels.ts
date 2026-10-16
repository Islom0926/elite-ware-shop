import { and, eq } from 'drizzle-orm';
import type { RequiredChannel, RequiredChannelInput } from '@tma-shop/shared';
import type { Database } from '../db/client.js';
import { requiredChannels } from '../db/schema.js';
import { toRequiredChannelDTO } from '../db/mappers.js';
import { ApiError } from '../lib/errors.js';

export async function listRequiredChannels(
  db: Database,
  shopId: string,
): Promise<RequiredChannel[]> {
  const rows = await db.select().from(requiredChannels).where(eq(requiredChannels.shopId, shopId));
  return rows.map(toRequiredChannelDTO);
}

export async function createRequiredChannel(
  db: Database,
  shopId: string,
  input: RequiredChannelInput,
): Promise<RequiredChannel> {
  const username = input.username.replace(/^@/, '').trim();
  const [row] = await db
    .insert(requiredChannels)
    .values({ shopId, username, title: input.title.trim() })
    .returning();
  if (!row) throw new Error('Failed to create required channel');
  return toRequiredChannelDTO(row);
}

export async function deleteRequiredChannel(
  db: Database,
  shopId: string,
  id: string,
): Promise<void> {
  const deleted = await db
    .delete(requiredChannels)
    .where(and(eq(requiredChannels.shopId, shopId), eq(requiredChannels.id, id)))
    .returning({ id: requiredChannels.id });
  if (deleted.length === 0) throw ApiError.notFound('Channel not found');
}
