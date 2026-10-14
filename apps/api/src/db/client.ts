import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

export type Database = ReturnType<typeof createDb>;

/** A transaction handle, as passed to `db.transaction(async (tx) => ...)` callbacks. */
export type DbTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/** Accepted by service functions that may run either standalone or inside a transaction. */
export type DbClient = Database | DbTransaction;

export function createPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

export function createDb(pool: Pool) {
  return drizzle(pool, { schema, casing: 'snake_case' });
}
