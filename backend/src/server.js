import { openDb } from './db.js';
import { createApp } from './app.js';
import { createMockProvider } from './payments.js';
import { seedMarket } from './marketSeed.js';

const prod = process.env.NODE_ENV === 'production';
if (prod && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set to a random value of 32+ characters in production');
}
const mock = !process.env.PEACH_CLIENT_ID && process.env.PAYMENT_PROVIDER !== 'peach';
if (prod && mock && process.env.ALLOW_MOCK_PAYMENTS !== '1') {
  throw new Error('No Peach credentials set. Configure Peach, or set ALLOW_MOCK_PAYMENTS=1 for a preview deployment (no real charges).');
}
const db = openDb(process.env.DB_PATH || './data.sqlite');
if (process.env.DEMO_SEED === '1') {
  seedMarket(db); // sample sellers with a public password: for previews only, never alongside real payments
  console.warn('DEMO_SEED=1: sample sellers and listings loaded (password "password123"). Turn this off for a real launch.');
}
const payments = mock && prod ? createMockProvider() : undefined;
const port = process.env.PORT || 3000;
createApp({ db, ...(payments && { payments }) }).listen(port, () => console.log(`MzansiConnect listening on :${port}`));
