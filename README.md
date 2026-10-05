# ThesisWatch

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
npm run build
npx tsc --noEmit -p convex/tsconfig.json
```

## Deploy

```sh
npm run deploy
```

This builds the app with the production backend URL, deploys the Convex backend, and uploads the frontend to its `.convex.site` address. Pushing code to GitHub does not deploy it.

Hosting uses the official [Convex static-hosting component](https://www.convex.dev/components/static-hosting).
