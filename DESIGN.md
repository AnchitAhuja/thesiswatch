# DESIGN.md

Read this before building or changing any screen. This records the implemented screens, not a proposed redesign.

## 1. Scope and screen selection

The current upload-first home and portfolio health card run on DEV (`fearless-ferret-257`) and production (`first-yak-309`). `src/main.js` sends every route, including `?create=holdings` and `?create=portfolio`, to `bindPortfolioHealth`. There is no stock-belief form or link to it in that experience.

The current entry point no longer loads `src/production-main.js`. Section 7 records those retained older modules. Do not apply the older thesis page's cream background, status badges or email layout to the health card. Detailed service errors remain visible only on DEV; production uses the existing generic fallback messages.

Sources: `src/main.js`, `src/production-main.js`, `src/lookout-experience.mjs`.

## 2. Home upload: the first screen's words

Top to bottom:

1. Transparent Lookout logo, linked to `/`, with alt text “Lookout”; image attributes are 160 × 32px. No “Back to home” link beside it.
2. Heading: “See your portfolio’s health in one place”.
3. Explanation: “See your holdings, gains, sectors, concentration, small positions and account charges from your Zerodha equity P&L Excel.”
4. One button: “Upload your portfolio excel”. It opens the hidden `.xlsx` file input.
5. Privacy note: “Your Excel stays in this browser. Only symbols and calculated facts are sent for analysis; your file and Client ID are never sent.”
6. Upload status, initially empty, followed by the initially empty report area.

The layout is left aligned on a dark background. There is no family photo, thesis composer, How It Works section or email signup in the upload screen. The upload area remains above the report after a file is read.

Source: `bindPortfolioHealth` in `src/portfolio-health.mjs`.

## 3. Health card sections, in order

1. **Your portfolio health card:** heading and a verified fact-only summary about position count, largest weight or small positions.
2. **Five headline cards:** Portfolio value → Invested → Unrealised gain (with percentage) → Holdings count → Largest position (with stock symbol).
3. **Worth a look:** position-limit input (default 5%, allowed 0.1–100%, step 0.1); broker-review exclusion note; table columns Stock → Flag → Value → Return → Why. Multiple flags for a stock share one row. The “Why” cell contains a validated factual note, not the visitor's investment belief.
4. **Where the money sits:** Top 12 holdings with horizontal percentage bars and a dashed position-limit line, then By sector. Sector labels are AI classified; unknown symbols are Other.
5. **Small positions:** count under 0.5% each, combined rupee value and combined portfolio percentage. “View names (n)” is a collapsed disclosure when there are small positions.
6. **Account this year:** Realised P&L → Trading charges → Other debits → Delayed payment charges. A positive delayed-payment amount adds “Delayed payment charges mean the trading balance went below zero.”
7. **Footer:** “Facts from your broker statement. Not investment advice.”

Rupees use Indian grouping with no paise; large headline totals use L/Cr with two decimals. Returns show a sign and one decimal; missing returns use a dash. Small-position combined weight uses two decimals. These are display formats, not changes to the underlying calculations. No buy/sell calls, target prices or trade-action buttons appear in the report.

Sources: `renderPortfolioReport`, `money`, `moneyTotal` in `src/portfolio-health.mjs`; `portfolioFlags`, `sectorTotals` in `shared/portfolio-health.mjs`.

## 4. Empty, loading and error states

- **Before choosing a file:** upload heading and button visible; report and upload status empty. No placeholder report cards.
- **File picker cancelled:** current page/report stays as it was.
- **Reading:** disable the upload button and input. Upload status says “Reading the statement in your browser…”; report says “Your portfolio health card” and “Reading statement…”.
- **Parsed:** local report appears immediately. Status says “Statement read. No file or Client ID was sent.”
- **Server work still running:** keep the local facts and local summary visible. Show “Writing the factual summary…”, “Finding sectors from symbols…” and “Writing factual note?” in their respective places. No skeleton cards are implemented here.
- **No usable positions:** status says “No current positions with usable values were found. See broker review below.” Totals and count are zero; largest position is a dash with “No current positions”. Broker-review rows appear in Worth a look, not in a separate broker-review section.
- **No flags:** table says “No positions meet these flag thresholds.” Zero small positions do not show the names disclosure.
- **Missing account data:** “Not in statement”; zero delayed charges do not show the balance explanation.
- **File error:** report says “Choose a valid statement to see portfolio facts.” with the facts-only footer. Status shows the relevant validation message or “This file could not be read as a Zerodha equity P&L statement.” Upload is enabled again.
- **Sector error:** show escaped DEV error detail and a “Retry sector lookup” button; retry affects sectors only. The renderer also contains a generic unavailable message when no DEV detail is available.
- **Summary error:** keep the local factual summary and show escaped DEV error detail. The renderer has a generic unavailable message as a fallback.
- **Factual-note error:** show escaped DEV error detail above the table and a dash for unavailable notes; the generic fallback is “Factual note unavailable.” No note-retry button is implemented.
- **Invalid position limit:** browser validation says “Use a limit from 0.1 to 100.” A valid change redraws the flags and dashed line without requesting new notes.
- **Another statement:** replaces the report and resets the position limit to 5%. Refresh returns to the initial upload screen; there is no saved-report view.

Source: `src/portfolio-health.mjs`.

## 5. Type and colour

Actual health-card rules come from `src/portfolio-health.css`, with shared base rules in `src/style.css`. Inter 400 and 600 are loaded by `src/main.js`.

| Use | Implemented value |
| --- | --- |
| Page background / primary text | `#131C17` / `#F0F0E7`; dark browser colour scheme |
| Card, table header, input and bar-track background | `#202D24` |
| Borders and dividers | `#41534A`; position-input border `#63766A` |
| Secondary text | `#B7C5BF` |
| Summary, links and bar fill | `#D7EABB` |
| Primary button | `#DFFA35` background, `#131C17` text; hover `#E8FF6B` |
| DEV service error | `#F0B8A7` |
| Dashed chart limit | `#F0F0E7` |
| Keyboard focus | 2px `#DFFA35` outline, 4px offset |

| Type | Size / line height / weight |
| --- | --- |
| Page body | 15px / 1.55 / 400 |
| Home and report h1 | `clamp(30px, 4vw, 46px)` / 1.15 / 400; tracking -0.035em |
| Section h2 | 24px / 1.3 / 600 |
| Chart h3 | 17px / inherited 1.55 / 600 |
| Report summary | 18px / inherited 1.55 / 400 |
| Metric label / detail | 13px; labels 600, details 400 |
| Metric value | 21px / 1.45 / 400; 19px at widths up to 540px |
| Table / limit label | 14px; table headers 600 |
| Upload and retry buttons | 14px / normal / 600 |
| Chart labels and percentages | 12px / inherited 1.55 / 400 |
| Privacy note / DEV errors | 12px / inherited 1.55 / 400 |
| Muted notes / account labels | 13px / inherited 1.55 / 400 |
| Small-position count | 28px / inherited 1.55 / 400 |
| Account amounts | 20px / inherited 1.55 / 400 |
| Footer | 13px / 1.6 / 400, inheriting the shared footer line height |

Numbers in metric values, account amounts, table values and bar percentages use equal-width digits. The home heading is limited to 22ch; explanation, privacy note and summary to 75ch. The health card has no STRENGTHENING/INTACT/WATCH/WEAKENING badges; those belong to the older holdings results.

## 6. Layout, spacing and responsive behavior

- Health-page wrapper: max width 1220px; padding `28px clamp(18px, 4vw, 48px) 64px`. It sits inside the existing `main#app`, which still has the shared main rules: max width 1240px, padding `56px 40px 30px`, changing to `32px 20px 24px` at widths up to 760px. Both layers currently contribute spacing.
- Navigation has 40px bottom margin and retains the shared nav padding `24px 0 18px`. Upload area has `56px 0 40px` padding and 40px bottom margin; at up to 540px its padding becomes 18px.
- Headline metrics: auto-fitting columns of at least 180px, 12px gaps; 18px card padding, 1px border, 12px corners. At up to 900px use three columns; at up to 540px use two, with the last card spanning both.
- Charts: two equal columns with a 32px gap; one column at up to 900px. Bar rows have 12px gaps and at least 42px height; tracks are 18px high, fill corners 2px.
- Flag table: horizontal scrolling inside a 1px border with 12px corners; cells have 14px padding. At up to 540px the table has a 670px minimum width.
- Account figures: four columns, 24px gaps; two columns at up to 540px. Positive delayed-payment note: 16px padding, 8px corners, card background.
- Position-limit input: 80px wide, 10px padding, 1px border, 7px corners. Section heading and input wrap when needed.
- Buttons: at least 44px high, 12px × 16px padding, 7px corners; disabled opacity .65 and wait cursor. Shared hover underline remains in addition to the health-card hover colour.
- Report sections have 44px bottom margin and retain shared section top spacing of 34px. Footer has a top divider and 24px top padding.
- Hidden file input opens from the labelled button. The skip link targets `#ph-report`; the report can receive focus and announces updates politely. Table scrolling can receive keyboard focus.

Sources: `src/portfolio-health.css`, `src/style.css`, `index.html`, `src/portfolio-health.mjs`.

## 7. Older screen modules retained

These remain in the repository but are no longer loaded by the current entry point on either deployment:

- **Home:** family photo with dark overlay, transparent logo, “How It Works” header link; centred “Invest. Then move on with your life” heading, explanation about watching investment reasons, “Get started” button leading to `?create=holdings`; three How It Works steps and a “My holdings” footer link. Heading 50px desktop / 32px phone, line height 1.03; explanation 16px/24px desktop and 14px/21px phone. Background `#131C17`, primary text `#F0F0E7`, explanation `#E1E8E1`, lime button `#DFFA35` with text `#18251D`.
- **My holdings entry:** stock suggestions, “What makes you believe in these stocks?” textarea, “Watch this stock” button and status text. Dark background `#131C17`, form `#202D24`, border `#41534A`, 12px corners; secondary text `#A8B7AC`; input border `#63766A`. Heading `clamp(34px, 5vw, 48px)`, lead 18px/1.6; buttons 15px/600, minimum 46px high.
- **Holdings checking/results:** company identity and three-step progress, followed by numbered original reasons, status, signal strength, evidence and source links. Includes interruption/retry states, the 3–5 year view note, and “Keep checking your reasons” email form. Background `#0C1712`, panels `#14221B`, reason rows `#1B2C23`, borders `#3C5147`; 16px panel corners. Page heading 32–48px/600; company name 30px/36px desktop, 23px/28px phone; reason 16px/24px; evidence 14px/22px; source/status 12px/18px.
- **Holdings status colours:** STRENGTHENING `#245740` on `#EAF3ED`; INTACT `#41534A` on `#EFF2EF`; WATCH `#805719` on `#FBF1DD`; WEAKENING `#8B3932` on `#F8EBE8`; No new evidence `#C3D0C8` on `#354940`.

Sources: `src/production-main.js`, `src/landing.mjs`, `src/holdings.mjs`, `src/holdings-results.mjs`, `src/standing.mjs`, and their selectors in `src/style.css`. Old thesis/edition descriptions are not the specification for the current upload flow.
