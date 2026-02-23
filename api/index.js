// Vercel serverless function entry point
import { app, setupApp } from '../dist/app.cjs';

let isSetup = false;

export default async function handler(req, res) {
  if (!isSetup) {
    await setupApp();
    isSetup = true;
  }
  
  return app(req, res);
}
