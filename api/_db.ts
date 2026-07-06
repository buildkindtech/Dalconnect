import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

// Serverless-optimized DB connection
// Each API function should call getDb() to get a connection
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Serverless optimizations
    max: 1,
    idleTimeoutMillis: 30000,
    // Neon 콜드스타트(브랜치 wake)에 2s는 너무 짧아 랜덤 500 유발 → 10s로 상향
    connectionTimeoutMillis: 10000,
    keepAlive: true,
  });
  
  return drizzle(pool, { schema });
}
