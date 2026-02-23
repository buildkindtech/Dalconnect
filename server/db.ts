import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not set. App will return setup instructions.");
}

const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null as any; // Fallback for build-time

export const db = drizzle(pool, { schema });
