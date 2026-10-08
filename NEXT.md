# Next session

## What works now

- Landing-page Build starts one dark chat thread using Inter and the landing palette.
- Lookout replies come from Claude through a Convex action with the whole conversation. The SDK requests structured JSON.
- The thread stops at four successful Lookout turns and produces a thesis sentence, three assumptions, watch signals, and a sector.
- Six model requests maximum per conversation, including explicit retries. No automatic model retries.
- Edit lets the user change the thesis and all three assumptions. Reasoning details and connected investments are optional fields.
- Save requires a valid email, stores the edited assumption in both the structured thesis and interpretation, and preserves the private tokenized link.
- Private-link reload retains the saved changes. Copy private link was checked in Chrome.
- Three saved theses maximum per normalized email, checked at Save. Drafts and failed chats do not count. Five investments maximum per thesis remains.
- Estimated Claude spend is tracked from response token usage. New requests are blocked at LOOKOUT_DAILY_AI_CAP_INR (default INR 300); the daily bucket resets at midnight IST. The check covers chat, legacy interpretation, and existing AI-thesis research. Already-running requests can finish.
- Cost conversion uses LOOKOUT_USD_INR_RATE (default INR 100/USD). Tracking began when this change was installed; earlier usage that day was not backfilled.
- All 28 tests passed. Type checking passed. Changes were pushed only to dev deployment fearless-ferret-257; production was untouched.

## Proof and its limits

- Latest walkthrough used the belief "I think retail consumption in India will go up" and answers "i'm not sure, help me refine it", "i dont know", and "you tell me".
- Two live Claude runs were used. The first failed because the final reply asked another question. The second failed because "selling groceries" triggered the trade-word filter.
- Fixes constrain final replies to statements, retain the stated belief, and neutralize a narrow set of retail-goods descriptions while continuing to reject securities trade wording.
- The second run's stored model response was reprocessed without a third live run. Its thread then reached the card, allowed an assumption edit, saved with email, and survived reload. A fresh end-to-end model run after the final filter fix has not been performed.
- Screenshots and raw saved record are in tmp/milestone-one/: final-01-landing.png through final-10-reloaded.png and final-saved-record-raw.json. These are local proof artifacts, not committed product assets.
- Failed first-run test data was deleted. The final saved test record remains on dev for review: jn77kgcmbf794mvvy7wg0j1ph98fwymg, email lookout-walkthrough@example.com. Preserve the two non-test theses.
- Local checkpoints: 8c2ca89 before walkthrough fixes; 95388f4 for assumption editing and provisional saving. No GitHub push or production deployment was performed for these fixes.

## Still open

- Saved theses can be provisional. Save now permits missing why, whatWouldProveItWrong, and timeHorizon so users can complete the approved uncertainty flow without invented answers.
- The saved walkthrough has all three fields null, missingFields listing them, and needsConfirmation true. It is marked saved because the user saved the draft, not because those details are known. This distinction must remain visible and must be respected by later research and email work.
- Decide what a provisional saved thesis is allowed to do before activating monitoring: require the missing details, or explicitly support monitoring with them unknown. Do not silently invent them or treat Save as agreement with suggested reasoning.
- Repeated uncertainty is still uneven: the final live run offered two product categories rather than two or three causal reasons. Prompt instructions alone have not proved that behavior reliable.
- Suggested reasons sometimes read as established facts (for example, assertions about middle-class growth) despite no research in the chat. They should be framed as possible explanations, not verified evidence.
- The blanket trade-word filter has a narrowly scoped retail-language exception; keep regression coverage so it never admits buy/sell/hold instructions about securities.
- Native structured JSON prevents format errors, but semantic mistakes and wording still need validation. The confirmation rule preserves durations and AND/OR clauses, but the exact earlier duration-scope bug has not been rechecked live since that prompt change.
- Current evidence is at 1280px for the latest walkthrough. The final fixes have not received a fresh phone-width walkthrough.
- No sign-in exists in v1. An email quota is an address-based limit, not verified identity; it can be bypassed by using another address. Private links grant view/edit access to whoever has them.
- The daily cap is an estimated token-cost guard, not an exact provider invoice or a reservation of in-flight spending. Existing requests can push the total over the threshold before subsequent requests are blocked.

## Stock piece: not started

- Primary universe: repo-stored Nifty 500 ind_nifty500list.csv from niftyindices.com, matched by Industry.
- Secondary universe: repo-stored nasdaqlisted.txt and otherlisted.txt from nasdaqtrader.com, excluding ETFs and test issues.
- Try Indian companies first. Add US-listed companies only for a global thesis or when fewer than three Indian companies have official supporting sources.
- Return three to six companies only from these lists. Each needs a sourced one-line connection from its own annual report or investor page; drop unsourced picks.
- Display India first, with labels "India · NSE" and "Global · US-listed". Label them "connected to this thesis"; no trade or recommendation wording. User selects at most five.
- Store market plus symbol, not an NSE-only symbol field.
- Separate budget: two model requests, twelve searches, eight source fetches. This is independent of the chat's six-request cap and also subject to the daily spend cap.
- Tests still to build: global AI thesis yields sourced US-listed companies; Indian consumption thesis yields only Indian companies; symbols absent from both universes are rejected.

## Custom-thesis update and email piece: not started

- A shared Convex action will research tracked companies with web search and produce sourced updates for both immediate delivery after signup and Saturday 04:30 UTC (10:00 IST) delivery.
- Preserve previous assessments when there is no new evidence. Say "no new evidence this week" instead of inventing developments.
- Use the existing official Convex Resend component, environment-held keys, and private unsubscribe links. Keep once-per-subscriber-per-edition delivery protection.
- Build real-recipient capability, but default to the Resend test recipient until switched by one environment variable.
- Keep per-update model/search/fetch budgets and the global daily spend guard. Do not activate these custom-thesis flows until the provisional-thesis decision is made.
- Existing AI-thesis newsletter, Resend setup, and Saturday cron already exist. The new custom-thesis stock selection, research, immediate email, and Saturday delivery integration have not been built. Saving a custom thesis currently sends no email and starts no monitoring.

## First thing tomorrow

Review the saved provisional thesis and decide whether why, whatWouldProveItWrong, and timeHorizon must be supplied before monitoring begins. Then verify one fresh end-to-end chat and save flow with the final fixes, including repeated uncertainty and precise confirmation wording, before starting stock matching. Stay on dev and agree the live-call budget before testing.
