# IDEA_SCOPE.md — Thesis Tracker

**Sprint:** GrowthX Build Sprint  
**Dates:** 2–17 October 2026  
**Primary track:** Revenue  
**Status:** LOCKED — changes go to Parking Lot unless required to complete the core flow.

## 1. Product lock

### One-sentence product
Turn an investing belief into a set of relevant stocks, then keep track of whether new evidence is strengthening or breaking that belief.

### Primary user
Financially literate working professionals — starting with CAs and corporate-finance professionals — who care about making informed investments but do not want investment research to become a second job.

### Wedge
> Finance matters to me, but I don't want researching investments to become a hobby.

Not optimized for complete investing beginners. Not optimized for finance obsessives who enjoy spending hours researching companies.

### Pain
“I have investment views, but I don't consistently have the time to monitor the companies, news and developments that could validate or invalidate them.”

### Core loop
**Write a belief → get relevant stocks → see evidence strengthening/breaking the belief → opt in to keep tracking it → receive the next update.**

The final “keep tracking this” action is essential. A one-off AI research answer is not the product.

### First thesis
Anchit's existing AI thesis. This is the hardcoded first end-to-end flow because an existing weekly workflow and prompt already exist.

### Second thesis
Indian retail / consumption, based on User #1's actual research interest.

## 2. Evidence already in hand

### Stated by founder
- Founder has manually run a weekly AI-thesis research workflow for roughly three months.
- Founder has invested based on this thesis, including SK Hynix / Korean exposure.
- Two prior LinkedIn posts produced two unsolicited messages despite little engagement.
- User #1 described insufficient time for desired investment research and an interest in Indian retail/consumption.
- User #1 uses products such as Tickertape, smallcase and Zerodha, pays for research subscriptions such as The Ken and ET Prime, and volunteered interest in building together.
- User #2 is an engineering lead at Scapia who previously asked for the GitHub/prompt.
- User #3 works in finance/advisory.
- User #4 is interested in investing beyond mutual funds/SIPs but is less financially sophisticated.
- Additional prospects are reachable through User #1's CA network.

### Existing prototype output
The founder's existing briefing already demonstrates the desired output shape: per-instrument thesis status plus supporting signals, watchlist alerts and evidence. It is an input to the prototype, not a specification that v1 must reproduce in full.

### Inference to test
The strongest initial wedge is financially literate but time-constrained professionals, particularly CAs/corporate-finance professionals. This is a hypothesis, not yet proven market segmentation.

## 3. Riskiest assumption — test before building

### Assumption
People besides the founder care enough about ongoing thesis monitoring that they will explicitly ask to receive future updates.

### 30-minute no-code test
Before product work:
1. Show User #1 a concise sample update using either the existing AI output or a manually prepared retail/consumption version.
2. Do not explain the machinery.
3. Ask for a real decision: **“Do you want me to keep tracking this and send you the next update?”**
4. Record yes/no and which thesis they want tracked.
5. If yes, ask how they would prefer to receive the next update.
6. Repeat with Users #2/#3 as quickly as possible.

### Pass signal
At least one non-founder target user explicitly opts in to another update. More opt-ins strengthen the case; compliments without opt-in do not count.

### If it fails
Do not add features. Interview the non-opt-ins about why the ongoing update is not worth receiving, revise the core promise once, and retest before expanding build scope.

## 4. Primary Sprint metric

**Real users who explicitly opt in to receive continuing thesis updates.**

Supporting funnel:
1. Real people shown product
2. Theses submitted/selected
3. Thesis results successfully generated
4. Explicit update opt-ins
5. Subsequent updates delivered
6. Users who return/respond
7. Payment attempts / revenue, if any

Do not substitute page views, likes or impressions for the primary metric.

## 5. v1 scope

### MUST work
- User can reach a live URL.
- User can log in.
- User can enter a free-text investment thesis.
- Product can associate the thesis with a manageable set of relevant stocks/instruments.
- Product presents evidence relevant to the thesis.
- Evidence is organized into a simple thesis assessment such as strengthening / breaking (with uncertainty where appropriate).
- Sources/evidence are visible enough for the user to inspect why the assessment was made.
- User can explicitly choose **Keep tracking this**.
- That opt-in is persisted so the founder knows who expects another update.
- AI thesis works end-to-end first.
- Retail/consumption becomes the second real thesis only after the first flow works.

### MUST NOT enter v1
- Buy/sell recommendations
- Trade execution
- Portfolio management
- Target prices
- Overvalued/undervalued scoring or a valuation engine
- Personalized investment advice
- Comprehensive global exchange coverage
- Social/community features
- Following creators or other people's theses
- Thesis marketplace
- Generic stock screener
- Beginner investing education
- Native mobile app
- Elaborate dashboards
- Perfect automated weekly delivery before the core opt-in loop is validated

### Market coverage rule
Support only the markets/instruments required by the first real users' theses. No “global coverage” project.

## 6. First ugly complete flow

The first engineering milestone is deliberately ugly and narrow:

**AI thesis hardcoded → relevant instrument set can be hardcoded → real evidence is displayed → thesis status is shown → user clicks Keep tracking this → opt-in is persisted → app is deployed on Convex → code is pushed to public GitHub.**

Hardcoding is allowed. Missing polish is allowed. An incomplete generic system is not.

Acceptance test:
- A person who did not build the app can open the URL, understand the proposition, complete the AI-thesis flow without verbal explanation, inspect evidence, and opt in.
- The opt-in can be verified in persisted data.
- The deployed version and public repository are accessible.

If behind, cut to:
- One thesis (AI)
- One fixed set of instruments
- One evidence/update screen
- One opt-in button
- No custom thesis generation yet

## 7. Six Sprint milestones

### Milestone 1 — Fri 2 Oct: Validate + lock
**Goal:** Test the riskiest assumption and freeze scope.

Tasks:
- Run the no-code continuing-update test with User #1.
- Contact Users #2 and #3 for the same test / Monday session.
- Freeze the product sentence, primary user, core loop and non-goals.
- Save this file in the repository.

Acceptance test:
- At least one non-founder gives a real yes/no answer to receiving another thesis update.
- IDEA_SCOPE.md is in the repo.
- No unresolved feature question blocks the first ugly flow.

If behind, cut to:
- Test only User #1 tonight.
- Use the existing AI briefing rather than preparing a new retail briefing.

### Milestone 2 — Sat 3 to Sun 4 Oct: Ugly end-to-end product live
**Goal:** A stranger can complete the core loop at a URL.

Build order:
1. Hardcoded AI thesis
2. Thesis → instrument mapping
3. Evidence/update display
4. Strengthening/breaking assessment
5. Keep tracking this
6. Persist opt-in
7. Login only as needed for the complete flow
8. Deploy
9. Push to GitHub

Acceptance test:
- Live URL works on a device/browser other than the build environment.
- A non-builder can complete the flow without explanation.
- At least one opt-in is persisted.
- Public GitHub contains the deployed version.

If behind, cut to:
- Hardcoded AI thesis and stocks.
- Manual/precomputed evidence is acceptable for the first deployed flow.
- One status screen.
- One opt-in.
- Remove custom thesis input temporarily.
- Do NOT cut deployment or the complete loop.

### Milestone 3 — Mon 5 to Wed 7 Oct: Watch real users
**Goal:** Observe where target users fail, misunderstand or disengage.

Monday tasks — scheduled, not optional:
- Session with User #1 (CA/Udaan): use retail/consumption if ready; otherwise AI.
- Session with User #2 (Scapia).
- Session with User #3 (finance/advisory).
- Invite User #4 as a contrast user if time permits.
- Ask User #1 for introductions into the CA network.

For each session record:
- Did they understand what to enter?
- Did mapped stocks make sense?
- Did they trust/inspect the evidence?
- Did strengthening/breaking help?
- Where did they stop?
- Did they click/agree to Keep tracking this?
- What would make them refuse the next update?

Tuesday distribution task:
- Send the live product directly into the warm CA network first.
- Prepare one public post only after direct outreach is underway.
- LinkedIn first among public channels; X/Instagram are secondary experiments, not required.

Wednesday:
- Fix the largest observed blocker.
- Use Sprint Q&A only for something genuinely blocking completion.

Acceptance test:
- At least 3 real people have attempted the product or prototype.
- Their observed failure points are written down.
- Opt-in count is known.
- The single biggest product blocker is identified.

If behind, cut to:
- Two live user sessions, not four.
- Manual onboarding is allowed for scheduling, but not while they use the core flow.
- Fix only the blocker preventing comprehension, evidence trust or opt-in.

### Milestone 4 — Thu 8 to Fri 9 Oct: Finish, no new scope
**Goal:** Ready to sell Friday night.

Allowed work:
- Fix observed blockers.
- Make custom thesis input work if the hardcoded flow proved useful.
- Add the retail/consumption thesis.
- Improve source clarity and evidence comprehension.
- Make opt-in state reliable.
- Basic analytics/counting needed for Sprint numbers.
- Fix severe mobile/browser issues.

Forbidden:
- New feature categories.
- Valuation engine.
- Social feed.
- Portfolio import.
- Trade integrations.
- New market coverage without a real user requirement.

Acceptance test:
- Core flow succeeds end-to-end for AI thesis.
- At least one second real-user thesis can be processed, ideally retail/consumption.
- Opt-ins are reliably countable.
- Product is stable enough to send without the founder sitting beside the user.
- Friday-night deployed version is the sell-week baseline.

If behind, cut to:
- AI + retail/consumption only.
- Founder can manually trigger/update research behind the scenes.
- Keep the user-facing experience complete; cut backend automation.

### Milestone 5 — Sat 10 to Fri 16 Oct: Sell + learn
**Goal:** Drive explicit continuing-update commitments and test willingness to pay.

Sat 10–Sun 11:
- Attend/use GTM masterclass.
- Produce product video.
- Start direct CA-network outreach.
- Make the first genuine attempt to charge or secure a concrete payment commitment. Do not wait for perfect pricing research.

Mon 12 — scheduled distribution:
- Public GTM goes live.
- Post on LinkedIn.
- Directly follow up with warm CA-network prospects.
- Use X/Instagram only if they do not steal time from direct outreach.

Tue 13–Fri 16:
- One public post per day as required by Sprint cadence.
- Continue direct outreach/referrals.
- Deliver promised updates to opted-in users.
- Ask opted-in users whether the update was worth receiving.
- Fold buyer feedback into the product only when it improves the locked core loop.
- Record payment attempts/revenue separately from compliments.

Acceptance test:
- Primary metric is updated daily.
- Every opt-in receives the promised follow-up/update.
- At least one real pricing/payment conversation has occurred.
- Product remains live.
- No major feature has been added outside the locked loop.

If behind, cut to:
- Warm CA network + LinkedIn only.
- Manual update delivery is acceptable.
- No new feature work unless it directly fixes conversion to opt-in or delivery of the promised update.

### Milestone 6 — Sat 17 Oct, before 11:00 AM IST: Verify + submit
**Goal:** Submit evidence, not last-minute features.

Reserve Saturday morning exclusively for:
1. Open live product in a clean browser and verify core flow.
2. Verify public GitHub repository.
3. Verify Convex deployment/login.
4. Capture screenshots of final numbers.
5. Record final primary metric: explicit continuing-update opt-ins.
6. Record supporting funnel numbers.
7. Record payment attempts/revenue truthfully.
8. Capture final product screenshots/video links needed for submission.
9. Submit before 11:00 AM IST.
10. Confirm submission succeeded.

Acceptance test:
- Live URL works.
- Public repo works.
- Numbers have screenshots/evidence.
- Submission is confirmed before deadline.

If behind, cut to:
- Stop coding.
- Submit the working version and truthful numbers.
- No Saturday-morning feature fixes unless the live product is literally inaccessible.

## 8. User roster

- **User #1:** CA friend at Udaan — primary target profile; retail/consumption thesis; gateway to CA network.
- **User #2:** Engineering lead at Scapia — interested early tester; treat separately from proof of the CA wedge.
- **User #3:** Flatmate's friend in finance/advisory — target-profile tester.
- **User #4:** Flatmate — time-constrained and curious about investing beyond mutual funds/SIPs; useful contrast user.
- **Next pool:** User #1's CA network, especially CAs working in corporate finance/advisory who understand finance but do not want to spend their weekends researching investments.

## 9. Distribution lock

1. Warm CA network / referrals — PRIMARY
2. LinkedIn — public secondary
3. X — optional secondary experiment
4. Instagram — optional secondary experiment

Do not judge the wedge solely by public social engagement. Direct target-user behavior and opt-ins matter more.

## 10. Evidence / product language guardrails

The product is a thesis-monitoring/research tool in this Sprint, not a recommendation engine.

Do not add:
- “Buy”
- “Sell”
- personalized trade instructions
- target prices
- execution

Prefer language such as:
- Evidence strengthening
- Evidence weakening / breaking
- What changed
- Why it matters to this thesis
- Sources
- Keep tracking this

Any regulatory claims used publicly must be separately verified before publication.

## 11. Parking lot

Nothing below is authorized for Sprint scope unless evidence shows the locked core loop cannot work without it.

- Valuation / overvalued-underpriced analysis
- Following someone else's thesis
- Public/shared theses
- Creator profiles
- Portfolio import
- Broker integration
- Trade execution
- Buy/sell recommendations
- Automated portfolio construction
- More sophisticated scoring
- Every-market support
- Notifications across multiple channels
- Native mobile app
- Social/community layer
- Personalized beginner education
- Advanced dashboards
- Thesis discovery
- Historical backtesting
- Any feature proposed mid-build that does not directly unblock thesis → evidence → ongoing opt-in

**Parking-lot rule:** when a new feature idea appears, add one line here. Do not implement it during the Sprint unless it replaces an existing scoped item rather than expanding scope.

## 12. Scope decision rule

When uncertain what to build, ask:

> Will this materially increase the chance that a real target user sees a thesis update and explicitly says “keep tracking this for me”?

If no, do not build it before the Sprint submission.

## 13. Next single action

**Before writing product code, send User #1 the sample thesis briefing and ask: “Do you want me to keep tracking this and send you the next update?” Record the answer.**

Then build the ugly AI-thesis flow — and nothing broader — until it is live.
