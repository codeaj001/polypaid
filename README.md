# PolyPay

Shareable payment links that accept any token from any chain and settle as **USDC on Polygon**, powered by [Trails](https://trails.build) intents.

Plain **React + Vite** single-page app — no server framework, no backend required to run it.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). **No environment variables are required** — the app runs on an in-memory-per-browser `localStorage` store (seeded with a few demo links) and a fully interactive mock of the Trails payment widget, so every screen works immediately: create a link, open it, "pay" it, watch the dashboard update.

Click "See a live example" on the home page (or go to `/dao-contributor-bounty-91ad`) to walk through a payment against seeded demo data.

## Does this actually do what the pitch says — any chain in, USDC on Polygon out?

Yes, with one scope note worth being precise about: "any chain" means any chain **Trails' solver network supports** (Ethereum, Polygon, Base, Arbitrum, Optimism, Avalanche, BNB Chain — an EVM intent network, not literally every chain that exists). Within that set, it's genuinely any token: the payer signs once, Trails' solvers swap and bridge behind the scenes (via Circle's CCTP for the USDC leg), and funds land automatically at the address/chain/token the link specifies. No second step from the recipient, no manual claim.

## What's real vs. mocked, and where to plug in production services


| Concern                           | Status & Implementation Details                                                                                                                                                             | Production Notes                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Payments**                      | **REAL**. `VITE_TRAILS_API_KEY` is configured in `.env`. `src/components/TrailsPayWidget.tsx` executes real Web3 on-chain transactions via connected wallets (MetaMask, Trust Wallet, Rabby, Coinbase) and routes via Trails. | Zero mock hashes remain. Real transactions sign on EVM chains, return verified transaction hashes, and trigger confirmation. |
| **Database**                      | **REAL SUPABASE**. `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are configured in `.env`. `src/lib/store.ts` connects directly to Supabase. | Run `supabase/schema.sql` followed by `supabase/schema_update_v2.sql` in your Supabase SQL Editor for production triggers, RPC functions, and realtime updates. |
| **Payment confirmation**          | **RPC & TRIGGER**. `markPaidByIntentOptimistic` calls the `confirm_payment_intent` Postgres RPC function and `trg_on_payment_confirmed` trigger to update payment links atomically. | The database RPC function and trigger manage link settlement state updates directly within Supabase. |
| **Wallet connect** | **REAL WEB3 PROVIDERS & OMS OTP**. `src/context/WalletContext.tsx` integrates window.ethereum EIP-1193 providers (MetaMask, Trust Wallet, Rabby, Coinbase) + Polygon OMS Email OTP. | Users can connect installed Web3 extensions or sign in via email OTP. |
| **Live pay-page status**          | **REALTIME + FALLBACK**. `src/hooks/useLinkStatus.ts` uses Supabase Realtime Postgres subscriptions (`payment_links` channel) with 3s polling fallback. | Requires Realtime enabled on `payment_links` (included in `schema_update_v2.sql`). |




## Project structure

```
src/
  main.tsx              app entry, React Router setup
  App.tsx                route table
  pages/
    Landing.tsx
    CreateLink.tsx        create-link form + live preview
    Dashboard.tsx          stats + links table
    PayPage.tsx             public pay page (reads :slug from the URL)
    NotFound.tsx
  components/            all UI, on the #FFFFFC / #0059FF design system
  context/WalletContext.tsx   multi-wallet + EIP-1193 + OMS wallet context
  hooks/useLinkStatus.ts      realtime-or-poll status hook
  lib/
    store.ts               data-access layer (localStorage <-> Supabase switch)
    store.local.ts          localStorage store
    types.ts / slug.ts / trails.ts
    supabase-client.ts       browser Supabase client (anon key only)
supabase/
  schema.sql            Initial Postgres schema + RLS
  schema_update_v2.sql  Database update schema (RPC, payment triggers, indexes, Realtime)
```



## Design system

Colors and type are Tailwind theme tokens (`tailwind.config.ts`), not one-off hex codes in components:

- `paper` — `#FFFFFC` background
- `blue` / `blue.dim` / `blue.mid` — `#0059FF` and tinted variants for accents, badges, CTAs
- `ink` / `ink.soft` — near-black text and muted secondary text
- Fonts: **Fraunces** (display/serif, headings & amounts), **JetBrains Mono** (addresses, labels, data), **Instrument Sans** (body) — loaded via Google Fonts `<link>` tags in `index.html`.



## Building & deploying

```bash
npm run build   # outputs static files to dist/
npm run preview # sanity-check the production build locally
```

`dist/` is a static site — deploy it to Vercel, Netlify, Cloudflare Pages, GitHub Pages, or any static host. Set the same env vars from `.env.example` in your host's dashboard if you're connecting real Trails/Supabase credentials; without them, the deployed app still runs fully on the local store.

## Known gaps / next steps

- No authentication — the dashboard shows all links in this browser's localStorage (or, in Supabase mode, all links in the table) rather than a per-creator view. Add Sign-In-With-Ethereum and scope reads/writes by creator once accounts matter.
- QR code generation (`qrcode` is already a dependency) isn't wired into the create-link preview yet — add a canvas/img render of `qrcode.toDataURL(url)` in `PayPreviewCard` or the success state in `CreateLink`.
- v1.1 items from the original spec (custom branding, multi-token settlement, x402 agent-payable endpoint) aren't implemented — the data model has room for them without a schema rewrite.

