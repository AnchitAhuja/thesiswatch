# PRODUCT.md

## What is current

The upload-first portfolio health card is live on DEV, `fearless-ferret-257`. It is not the production home page. This document describes that v1 and distinguishes the older production flow below.

Source: `src/main.js` selects the health card only when `VITE_CONVEX_URL` is `https://fearless-ferret-257.convex.cloud`. On that deployment, the home page and `?create=holdings` both show the upload screen. Other deployments load `src/production-main.js`.

## The job

The story: I want to make an informed choice with this month's money, without spending my weekend researching.

The built product helps me see the facts about the portfolio I already have: holdings, gains, where the money sits, concentration, small positions and account charges. The card states facts only, never buy/sell calls.

I decide, and I buy or sell through my own broker. (Outside the product.)

## The user

An investor who already has holdings and a Zerodha equity P&L `.xlsx` statement. The current input is that statement, not a connection to the investor's broker account.

## The core flow

1. I open the website on DEV.
2. I see “See your portfolio’s health in one place”, one line explaining what I get, and “Upload your portfolio excel”.
3. I choose my Zerodha equity P&L `.xlsx` file. The file is read and parsed in the browser; it is never uploaded to the server. Client ID is not used or sent.
4. I see “Your portfolio health card” below the upload area on the same page. The statement facts appear before the server finishes sector labels and factual wording. (First value)
5. I see portfolio value, invested amount, unrealised gain and percentage, holdings count and largest position.
6. I review “Worth a look”, “Where the money sits”, “Small positions” and “Account this year”. I can change the position limit, expand the small-position names, or retry a failed sector lookup.
7. I can choose another statement using the same upload button. It replaces the report; it does not compare statements. Refreshing the page returns to the upload screen.

Source: `src/portfolio-health.mjs`, `shared/portfolio-health.mjs`.

## v1

- Accepts `.xlsx` files up to `10 * 1024 * 1024` bytes and at most 1,000 usable current positions. No login, no paywall in this flow.
- Reads the first sheet's equity P&L table and the second sheet's account ledger. Headers can begin below the top row and in any column.
- Includes positive open quantities; combines repeated security identifiers (ISINs), and sorts usable positions by value. Current value is invested amount plus unrealised P&L from the statement, not a live price feed.
- Excludes rows with missing identifiers or unusable values from portfolio totals and flags them “Check with your broker”.
- Shows a fact-only summary and the five headline figures. “Worth a look” groups flags once per stock: above the chosen position limit (default 5%), value more than 5 times invested amount, return below -40%, or broker review. These flags are observations, not instructions to trade.
- Shows the top 12 holdings by weight and the sector breakdown. Sector labels are AI classified from symbols; unknown symbols are “Other”.
- Shows the count, combined value and combined portfolio weight of positions under 0.5% each; names start collapsed.
- Shows realised P&L, trading charges, other debits and delayed payment charges from the statement. Missing account amounts say “Not in statement”. Positive delayed payment charges show the explanation about the trading balance going below zero.
- Formats displayed rupees without paise and large headline amounts in lakh/crore form. Calculations retain their underlying precision.
- Ends with “Facts from your broker statement. Not investment advice.”

Source: `src/portfolio-health.mjs`, `shared/portfolio-health.mjs`.

## Privacy and factual wording

The Excel file stays in this browser tab. This is browser parsing with limited server assistance, not a wholly offline tool:

- Only stock symbols go to sector lookup. The server caches sector labels by symbol.
- Only the largest-position percentage and position counts go to the summary service. The displayed summary must match one of the verified factual phrasings; a local factual summary is available immediately.
- Anonymous row identifiers and calculated numeric facts go to the factual-note service for the “Why” column. These include weights, gains, invested amounts and ranks, without stock names, the spreadsheet or Client ID. Those notes explain the figures; they do not ask why the investor believes in a stock.
- Factual notes are checked against the supplied numbers and reject trading instructions, targets and invented time history. Changing the position limit does not request another batch of notes.

Source: `src/portfolio-health.mjs`, `shared/portfolio-why.mjs`, `convex/portfolioAI.ts`, `convex/portfolioSectors.ts`.

## What can go wrong

- The file is the wrong format, too large, missing required columns, has an invalid delayed-payment entry, or has too many current positions: show a readable error and allow another file selection.
- No usable current positions: render the card's zero/empty values and any broker-review flags; the upload status explains that no usable current positions were found.
- Sector lookup fails: keep the local statement facts visible and offer “Retry sector lookup”.
- Summary or factual notes fail validation or the service is unavailable: retain the local facts and fallback summary. DEV displays escaped service error text; missing factual notes show a dash when the DEV error is available.

Source: `src/portfolio-health.mjs` and the shared parser and wording checks above.

## Onboarding

First value: the health card on the same page after choosing a statement. No email or account is required before seeing it. There is no subscription step in the upload flow.

## Not in v1

- Broker connect or automatic account syncing.
- Monthly comparison, saved portfolio history or automatic refresh from a broker.
- Analyst price targets or future-return predictions in the health card.
- Buy/sell actions, order placement, or buy, sell or hold advice.
- An investment-thesis editor, stock-belief questionnaire, watchlist or weekly-email signup inside the upload flow.
- Support for arbitrary broker spreadsheets, CSV, PDF or `.xls` imports.
- A separate complete holdings table: the card currently shows the top 12 chart, flagged stocks and expandable small-position names.

## Older production flow still in the code

Production remains different. `src/production-main.js` and `src/landing.mjs` show “Invest. Then move on with your life”, a “Get started” button, “How It Works”, and a “My holdings” footer link. `?create=holdings` opens `src/holdings.mjs`: choose a supported stock, write business reasons, and check those reasons against evidence. Results include progress, statuses, signal strength and source links, plus an email signup for a weekly check (`src/holdings-results.mjs`, `src/standing.mjs`).

That form and its navigation are absent from the DEV upload experience. Older AI-thesis and edition modules are not the current DEV core flow; their presence in the repository is not a promise that the health card includes them.
