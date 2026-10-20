import { DatabaseSync } from 'node:sqlite';

export function openDb(path = process.env.DB_PATH || ':memory:') {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`
CREATE TABLE IF NOT EXISTS m_users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('buyer','seller')),
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS m_sellers (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES m_users(id),
  name TEXT NOT NULL,
  village TEXT NOT NULL,
  phone TEXT,
  rating REAL NOT NULL DEFAULT 4.5,
  sales INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS m_listings (
  id INTEGER PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES m_sellers(id),
  dept TEXT NOT NULL,
  sub TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('good','service')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  unit TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  sold INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  photo_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS m_photos (
  id INTEGER PRIMARY KEY,
  mime TEXT NOT NULL,
  data BLOB NOT NULL
);
CREATE TABLE IF NOT EXISTS m_orders (
  id INTEGER PRIMARY KEY,
  buyer_id INTEGER NOT NULL REFERENCES m_users(id),
  state TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('deliver','collect')),
  pay TEXT NOT NULL CHECK (pay IN ('cash','eft','card')),
  payment_status TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  area TEXT NOT NULL,
  directions TEXT NOT NULL DEFAULT '',
  stand TEXT NOT NULL DEFAULT '',
  subtotal_cents INTEGER NOT NULL,
  delivery_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS m_order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES m_orders(id),
  listing_id INTEGER NOT NULL REFERENCES m_listings(id),
  seller_id INTEGER NOT NULL REFERENCES m_sellers(id),
  title TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_price_cents INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS m_order_sellers (
  order_id INTEGER NOT NULL REFERENCES m_orders(id),
  seller_id INTEGER NOT NULL REFERENCES m_sellers(id),
  status TEXT NOT NULL DEFAULT 'Processing',
  delivery_cents INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (order_id, seller_id)
);
CREATE TABLE IF NOT EXISTS m_requests (
  id INTEGER PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES m_listings(id),
  seller_id INTEGER NOT NULL REFERENCES m_sellers(id),
  buyer_id INTEGER NOT NULL REFERENCES m_users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  area TEXT NOT NULL,
  date TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'New',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS m_listings_dept ON m_listings(dept, active);
CREATE INDEX IF NOT EXISTS m_orders_buyer ON m_orders(buyer_id);
CREATE INDEX IF NOT EXISTS m_items_seller ON m_order_items(seller_id);
`);
  return db;
}
