# PolyPaid

Shareable payment links that accept any token from any chain and settle as **USDC on Polygon**, powered by [Trails](https://trails.build) intents.

Plain **React + Vite** single-page app backed by Supabase. Production payments require the official Trails SDK and server-side receipt verification; the app intentionally disables checkout when that integration is unavailable.

## Quick start

```bash
npm install
npm run dev
```

The current repository is fail-closed: it does not simulate payments or mark links paid from the browser. See [the production plan](docs/PRODUCTION_PLAN.md) for the required services, security model, agent workstreams, and launch gates.

## Production foundation

After installing dependencies, enable Supabase Web3 Auth for Ethereum, apply the migrations, and deploy the verifier:

```bash
npm install
supabase db push
supabase secrets set TRAILS_API_KEY=... APP_ORIGIN=https://your-domain.example
supabase functions deploy verify-trails-payment --no-verify-jwt
```

The verifier is intentionally public because payers need not own a PolyPaid account. It can only confirm a previously recorded Trails session, and confirmation succeeds only when the provider receipt exactly matches the stored Polygon chain, native USDC contract, recipient, and six-decimal atomic amount.

Required production checks:

- Register the production URL in Supabase Auth redirect URLs.
- Enable the Ethereum Web3 provider, CAPTCHA, and Web3 login rate limits.
- Use a server-side Trails API key for the Edge Function; never expose it under a `VITE_` name.
- Set `APP_ORIGIN` to the canonical HTTPS application origin.

## Verification and dependency posture

```bash
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

CI runs the same gates from the committed lockfile. At the time of this
foundation, the production tree has no high or critical advisories. Moderate
advisories remain inside Trails' bundled Mesh/Solana dependency chain; npm's
suggested remediation is a breaking Trails downgrade, so this must be tracked
with Trails and re-audited before launch rather than force-installed.

`vercel.json` supplies SPA routing, HTTPS enforcement, anti-framing, MIME
sniffing protection, a restrictive browser permissions policy, and immutable
caching for fingerprinted assets.
