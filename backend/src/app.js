import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import { openDb } from './db.js';
import { mountMarketEarly, mountMarket } from './market.js';
import { providerFromEnv } from './payments.js';

// The whole product is one small service: the API under /api and the website at /.
export function createApp({
  db = openDb(),
  secret = process.env.JWT_SECRET || 'dev-secret-change-me',
  payments = providerFromEnv(),
  authLimit = 10,
  demo = process.env.DEMO_SEED === '1',
  contact = { email: process.env.SUPPORT_EMAIL, phone: process.env.SUPPORT_PHONE },
  publicDir = fileURLToPath(new URL('../public', import.meta.url)),
  publicUrl = process.env.PUBLIC_URL || 'http://localhost:3000',
} = {}) {
  const app = express();
  app.set('trust proxy', 1); // behind Render's proxy, so req.ip is the real client
  app.disable('x-powered-by');
  app.use(compression()); // smaller downloads on mobile data
  app.use((_req, res, next) => {
    res.set({ 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'strict-transport-security': 'max-age=15552000' });
    next();
  });

  // Registered before the JSON parser: the Peach webhook needs the raw body, photo uploads need a bigger limit.
  mountMarketEarly(app, { db, secret, payments });
  app.use(express.json({ limit: '50kb' }));
  mountMarket(app, { db, secret, payments, publicUrl, authLimit, demo, contact });

  app.get('/health', (_req, res) => res.json({ ok: true }));

  if (fs.existsSync(path.join(publicDir, 'index.html'))) {
    const page = (res) => {
      res.set({
        'cache-control': 'no-cache',
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'",
        'x-frame-options': 'SAMEORIGIN',
      });
      res.sendFile(path.join(publicDir, 'index.html'));
    };
    app.use(express.static(publicDir, { index: false, maxAge: '1h' }));
    app.get('/', (_req, res) => page(res));
    app.get(/^\/(shop|product|cart|checkout|my-orders|order|saved|login|sell|dashboard|help|terms|privacy)(\/.*)?$/, (_req, res) => page(res));
    // any other address typed into a browser gets the site's own "page not found"
    app.get(/^(?!\/(api|health)(\/|$))/, (req, res, next) => {
      if (req.accepts(['json', 'html']) !== 'html') return next();
      res.status(404); page(res);
    });
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That upload is too large.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'The request could not be read.' });
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  });
  return app;
}
