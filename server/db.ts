import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

// Lazy initialization: only create pool when actually querying
// This prevents build-time errors when DATABASE_URL is not available
function createDbConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Connection pool settings for serverless
    max: 1,
    idleTimeoutMillis: 30000,
    // Neon 콜드스타트에 2s는 너무 짧아 랜덤 500 유발 → 10s로 상향
    connectionTimeoutMillis: 10000,
    keepAlive: true,
  });
  
  return drizzle(pool, { schema });
}

// Export a lazy-initialized db instance
let dbInstance: ReturnType<typeof drizzle> | null = null;

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!dbInstance) {
      dbInstance = createDbConnection();
    }
    return (dbInstance as any)[prop];
  }
});
