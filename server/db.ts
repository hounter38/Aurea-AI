import * as schema from "@shared/schema";

let db: any;
let pool: any;

if (process.env.DATABASE_URL) {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const pg = await import("pg");
  const { Pool } = pg.default;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
  console.log("Using PostgreSQL database");
} else {
  console.log("DATABASE_URL not set — using in-memory storage");
  db = null;
  pool = null;
}

export { db, pool };
