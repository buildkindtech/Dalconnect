# Replit → Vercel Migration Guide

## Problem: Architecture Mismatch

**Replit:**
- Express monolith (single server process)
- `server/index.ts` → one entry point
- `server/routes.ts` → all routes together
- Shared dependencies in `server/`

**Vercel:**
- Serverless functions (each API endpoint isolated)
- `api/*.ts` → independent functions
- No shared state between functions
- Each function bundles its own dependencies

## Solution Pattern

### 1. Create Independent API Functions

**❌ Wrong (Replit style):**
```typescript
// api/businesses.ts
import { storage } from '../server/storage';  // ❌ Dependency on server/

export default async function handler(req, res) {
  const results = await storage.getBusinesses();  // ❌
  return res.json(results);
}
```

**✅ Correct (Vercel style):**
```typescript
// api/businesses.ts
import { getDb } from './_db';  // ✅ Local DB helper
import { businesses } from '../shared/schema';  // ✅ Shared types only

export default async function handler(req, res) {
  const db = getDb();  // ✅ Create connection in function
  const results = await db.select().from(businesses);  // ✅ Direct query
  return res.json(results);
}
```

### 2. Shared DB Helper Pattern

Create `api/_db.ts` for serverless-optimized connections:

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }
  
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Serverless optimizations
    max: 1,  // One connection per function
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  return drizzle(pool, { schema });
}
```

### 3. Update vercel.json

```json
{
  "buildCommand": "npm run build:client",  // Frontend only
  "outputDirectory": "dist/public",
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    { "source": "/api/businesses", "destination": "/api/businesses" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 4. Update package.json

```json
{
  "scripts": {
    "build": "tsx script/build.ts",  // Replit: full server build
    "build:client": "vite build",    // Vercel: frontend only
    "dev": "tsx server/index.ts"     // Replit: local dev
  }
}
```

## Migration Checklist

- [ ] Create `api/_db.ts` with serverless DB connection
- [ ] Convert each `api/*.ts` to use `getDb()` directly
- [ ] Remove `import { storage } from '../server/storage'`
- [ ] Add `"build:client": "vite build"` to package.json
- [ ] Update `vercel.json` buildCommand
- [ ] Install `@vercel/node` types
- [ ] Test locally: `npm run build:client`
- [ ] Deploy to Vercel

## Key Differences

| Aspect | Replit | Vercel |
|--------|--------|--------|
| Architecture | Monolith | Serverless |
| Entry point | `server/index.ts` | `api/*.ts` |
| Dependencies | Shared in `server/` | Bundled per function |
| DB connection | One pool for all routes | One pool per function |
| Build | Full server bundle | Frontend + API functions |
| State | Shared in memory | No shared state |

## Common Errors

### 1. `FUNCTION_INVOCATION_FAILED`
**Cause:** API function importing from `server/`  
**Fix:** Use `api/_db.ts` instead

### 2. `DATABASE_URL not set` at build time
**Cause:** DB connection created at module load  
**Fix:** Create connection inside handler function

### 3. Slow builds (30+ minutes)
**Cause:** Building full Express server  
**Fix:** Use `build:client` for frontend only

## Testing

```bash
# Local test (with Replit server)
npm run dev

# Vercel local test
vercel dev

# Production test
vercel --prod
```

## Notes

- Keep `server/` folder for local Replit development
- `shared/schema.ts` can be shared (types only, no runtime code)
- Environment variables are injected at runtime, not build time
- Each API function cold starts independently
