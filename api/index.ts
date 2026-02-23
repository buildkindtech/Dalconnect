import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes once
let routesInitialized = false;

async function initRoutes() {
  if (!routesInitialized) {
    await registerRoutes(null, app);
    routesInitialized = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initRoutes();
  
  // Convert Vercel request to Express
  (req as any).url = req.url || '/';
  (req as any).method = req.method || 'GET';
  
  return app(req as any, res as any);
}
