# Lookout

A Vite app with a Convex backend and Convex static hosting.

## Run locally

```sh
npm ci
npx convex dev --once
npm run dev
```

Convex creates `.env.local` for your project. This file is ignored by Git and must never be committed. The frontend uses `VITE_CONVEX_URL` from it.

## Check changes

```sh
npm test
node scripts/check-edition.mjs
npm run test:newsletter
npm run build
npx tsc --noEmit -p convex/tsconfig.json
```

## Deploy

```sh
npm run deploy
```

This builds the app with the production backend URL, deploys the Convex backend, and uploads the frontend to its `.convex.site` address. Pushing code to GitHub does not deploy it.

Hosting uses the official [Convex static-hosting component](https://www.convex.dev/components/static-hosting).

## Email editions

Email uses the official `@convex-dev/resend` component with `testMode: true`.
`RESEND_API_KEY` belongs in Convex environment variables, never in source or the browser.
In test mode, only `delivered`, `bounced`, or `complained` addresses at `resend.dev`
(including `+` labels) receive email. Other signups still save normally.

Initialize the existing Oct 4 edition once in each deployment:

```sh
npx convex run editions:seedCurrent
npx convex run editions:seedCurrent --prod
```

This copies the existing 11 positions, assessments, sources and date into an immutable
saved edition. It never replaces an existing saved edition. Future editions are saved
through the internal `editions:save` mutation: `key`, `date`, `publishedAt` (milliseconds)
and `positions` (each with `ticker`, `name`, `group`, `thesis`, `status`, `reason`, `source`).
Keys are unique; publishing the same key cannot overwrite content already sent.
Saving an edition does not change the pages or generate new research.

Signup queues the newest saved edition. `convex/crons.ts` queues that edition every
Saturday at 04:30 UTC (10:00 AM IST), in batches of 50 subscribers. A transactional
delivery record and component idempotency key prevent duplicate signup/weekly sends.
When no edition is saved, sending waits until a later weekly run.

Private links use 32 random bytes and `/api/unsubscribe` on the Convex site. Opening
a link shows a confirmation; submitting it stops future mail and cancels pending mail
where the provider has not already sent it. Each email also supports one-click
unsubscribe headers. Submitting the existing signup again reactivates a subscription,
with a fresh link, without resending an edition already queued for that subscriber.

`mail:testDelivery` and `mailActions:testReceipt` are internal-only checks for
`delivered+test@resend.dev`. The latter returns Resend's unchanged retrieval response,
not the API key or request headers.
