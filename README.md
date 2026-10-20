# MzansiConnect

A marketplace where people in **Giyani and the villages around it** (Limpopo) buy and sell firewood, livestock, farming supplies,
fresh produce and building materials, and book tractor, water and transport services. Anyone can register as a seller for free.

| Part | What it is | Where |
|---|---|---|
| Website | Plain HTML, CSS and JavaScript (no build step). Works on any phone and can be added to the home screen. | `backend/public` |
| API | Node 22 and Express. Accounts, listings, per-seller orders, service requests, photos, Peach payments. SQLite database. | `backend/src` |
| Android app | A small Capacitor shell that opens the live site full screen, with camera access for seller photos. | `android-app` |
| Design preview | The clickable concept the site was built from. | `design` |

## How it works
- **Delivery is arranged by the sellers.** R30 within the same village, R60 to other villages, free over R800 per seller, livestock agreed with the seller. Buyers can collect instead.
- **Payment:** cash on delivery or collection, instant EFT, or card (through [Peach Payments](https://www.peachpayments.com)). An online order is only passed to the seller after Peach's signed confirmation for the correct amount arrives.
- **Phone numbers** are shared only after an order or request, never shown on public listings.
- **Preview mode:** `DEMO_SEED=1` loads sample sellers (all fictional) and shows a "Preview version" banner. Demo logins: `tsakani@demo.test` (buyer) and `chauke@demo.test` (seller), password `password123`.

## Run it
```bash
cd backend
npm install
npm run dev        # http://localhost:3000 with sample data
npm test           # automated tests
```
Needs Node 22.13 or newer.

## Deploy
`render.yaml` deploys the site and API as one service on [Render](https://render.com) (Render > New > Blueprint).
Settings are environment variables:

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Long random string (Render generates it). Required in production. |
| `PUBLIC_URL` | The site's public address. If you ever move to a new address, also change `server.url` and `allowNavigation` in `android-app/capacitor.config.json` and rebuild the app. |
| `DEMO_SEED` | `1` loads sample data. Remove for a real launch. |
| `ALLOW_MOCK_PAYMENTS` | `1` allows the test payment button. Remove once Peach is configured. |
| `PEACH_ENV`, `PEACH_CLIENT_ID`, `PEACH_CLIENT_SECRET`, `PEACH_MERCHANT_ID`, `PEACH_ENTITY_ID`, `PEACH_WEBHOOK_SECRET` | Peach Payments (sandbox first). Webhook URL: `PUBLIC_URL/api/payments/peach/webhook`. |
| `SUPPORT_EMAIL`, `SUPPORT_PHONE` | Shown in the footer and on the Help, Terms and Privacy pages. |
| `DB_PATH` | SQLite file. Mount a persistent disk (for example `/data/data.sqlite`) so data survives restarts. |

**Free hosting resets the database on every restart.** Use a paid instance with a disk before real sellers join.

## Android app
GitHub Actions builds it on every change to `android-app/` and publishes it at
[Releases > android](../../releases/tag/android). See `android-app/README.md`.

## Before a real launch
- Persistent storage (see above), and remove `DEMO_SEED` and `ALLOW_MOCK_PAYMENTS`.
- Peach sandbox test, then live credentials. The Peach request and webhook formats in `backend/src/payments.js` are marked `[VERIFY]` and must be confirmed against Peach's sandbox.
- A private signing key for the Android app (the preview key is public) and a Google Play account.
- Have the Help, Terms and Privacy text reviewed, and add support contact details.
- Check the village list in `backend/src/catalog.js` with people from Giyani.
