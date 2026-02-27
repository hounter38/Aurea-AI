import { drizzle } from "drizzle-orm/pg-proxy";
import pg from "pg";
import * as schema from "../shared/schema.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({
  client: pool,
  schema,
  async query(sql: string, params: unknown[]) {
    const result = await pool.query(sql, params as any[]);
    return { rows: result.rows };
  },
});

export { pool };
