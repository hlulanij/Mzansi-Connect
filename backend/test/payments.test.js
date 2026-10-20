import test from 'node:test';
import assert from 'node:assert/strict';
import { createPeachProvider, marketRef, marketIdFromRef, toMoney } from '../src/payments.js';

test('peach adapter authenticates, then creates a ZAR checkout with the exact amount', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return url.endsWith('/api/oauth/token')
      ? { ok: true, status: 200, json: async () => ({ access_token: 'tok', expires_in: 300 }) }
      : { ok: true, status: 200, json: async () => ({ checkoutId: 'chk_1' }) };
  };
  const env = { PEACH_ENV: 'sandbox', PEACH_CLIENT_ID: 'c', PEACH_CLIENT_SECRET: 's', PEACH_MERCHANT_ID: 'm', PEACH_ENTITY_ID: 'e', PEACH_WEBHOOK_SECRET: 'w' };
  const co = await createPeachProvider({ env, fetchImpl }).createCheckout({ ref: 'MCON00000001', amountCents: 12345, publicUrl: 'https://api.test' });
  assert.equal(co.checkoutId, 'chk_1');
  const body = JSON.parse(calls[1].init.body);
  assert.equal(calls[1].init.headers.authorization, 'Bearer tok');
  assert.deepEqual([body.amount, body.currency, body.merchantTransactionId], ['123.45', 'ZAR', 'MCON00000001']);
});

test('order references are 12 characters and round-trip', () => {
  assert.equal(marketRef(42).length, 12);
  assert.equal(marketIdFromRef(marketRef(42)), 42);
  assert.equal(marketIdFromRef('nonsense'), null);
  assert.equal(toMoney(250), '2.50');
});
