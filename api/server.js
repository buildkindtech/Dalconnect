import express from 'express';
import { registerRoutes } from '../dist/index.cjs';

const app = express();

// Register all routes from the built server
registerRoutes(app);

export default app;
