import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
<<<<<<< HEAD
  throw new Error("DATABASE_URL is required");
=======
  throw new Error("DATABASE_URL, ensure the database is provisioned");
>>>>>>> origin/main
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
