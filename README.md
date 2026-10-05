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
npm run test:research
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

## Scheduled Claude research

`research weekly AI thesis` runs Saturdays at 03:30 UTC (9:00 AM IST). The
first permitted run is October 10, 2026 at 9:00 AM IST. Each window covers
after the previous Saturday's 9:00 AM through this Saturday's 9:00 AM, with
the end included and start excluded. The dates advance automatically.

The schedule is enabled only where `RESEARCH_SCHEDULE_ENABLED=true` is set
in Convex environment variables. Keep it disabled in development to avoid
running a second paid research job. Each edition date gets one durable
workflow and agent thread. The latest approved edition and exact prompt
are saved with the run before research starts.

Claude uses the official Convex Agent and Workflow components. It prefers
the Convex AI Gateway's native Anthropic Messages interface when available;
otherwise it uses `ANTHROPIC_API_KEY` from the target Convex environment.
Keep credentials out of source files, the browser and chat. Claude app
subscriptions do not supply backend API credentials. Model calls and web
search use the configured provider's paid usage.

The model is Claude Sonnet 4.5, with native web search and web fetch. Each
run is limited to 30 searches, 40 fetches, four model steps, 12,000 output
tokens per step and eight minutes. Provider calls are not automatically
repeated after failure. Failed or incomplete research is recorded privately
for review. These are execution limits, not a promise that every source is
accessible or every draft is correct.

The instructions are generated from `prompts/weekly-ai-thesis.md`:

```sh
npm run sync:research-prompt
npx convex dev --once
```

`npm run build` also syncs the instructions before production deployment.
The human example's fixed reporting dates and previous edition are excluded
from the generated instructions; scheduled runs use live approved data.

Check access and read the latest private draft with:

```sh
npx convex run researchActions:configuration --prod
npx convex run research:latestDraft --prod
```

Drafts live in `researchRuns`, separate from approved `editions`. Review
`editorReview` and `readerEdition` in the result. A `READY FOR EDITOR REVIEW`
draft still needs human review. After checking it, save the approved
position assessments with the existing internal `editions:save` mutation
before the 10:00 AM email job. Without a newly approved edition, the mail
job retains its existing behavior and does not publish or email the draft.
Repeated weekly email runs still cannot resend an edition already queued.
The existing sender's `testMode: true` restriction remains in force.

This schedule does not change either page, the tracked positions, signup,
unsubscribe behavior or the existing 10:00 AM send schedule.
