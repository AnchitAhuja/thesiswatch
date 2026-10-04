# Overnight design audit

Date: 5 October 2026
Branch: `overnight-fixes`
Local landing: http://127.0.0.1:5177/
Local thesis: http://127.0.0.1:5177/?thesis=ai

Read DESIGN.md, PRODUCT.md and IDEA_SCOPE.md before making changes. Checked DESIGN.md sections 3 and 4 against both pages in a real Edge browser at 390px and 1280px wide, using 900px viewport height and an additional signup visibility check at 720px height. No deployment or push was performed.

## Mismatches found and fixed

| Mismatch | Fix | Verification |
| --- | --- | --- |
| The laptop signup started below the whole introduction. Its initial box extended from roughly 548px to 777px, so a 720px-high laptop viewport cut it off, contrary to "always visible." | The existing signup now occupies the left column alongside the whole thesis page and remains sticky while scrolling. The introduction and position content occupy the right column. Phone positioning is unchanged. | Signup fully visible initially and while scrolling at 1280px; also checked at 720px height. |
| Loading used three equal-height boxes in a two-column grid, leaving the identity/reason/assessment shapes unlike the actual rows. | The identity placeholder spans the two text rows on laptop; the reason placeholder uses the shorter text shape. On phone all three stack like the actual row. | Eleven shimmer rows checked at both widths; reduced-motion settings disable animation. |
| A new load or failed reload could leave the previous edition date and next-edition message above loading/error content. | Clear and hide the old date and clear the old message when loading starts. A successful load restores the correct date. | Browser checks and a saved regression check cover loading, failure and successful Refresh. |
| The edition controller kept only the cache read at initialization. A later empty response could lose an edition recovered during the same controller session. | Update the existing in-memory latest edition and returning-visit flag after successful rendering. No new storage mechanism or page controls were added. | Saved regression check confirms the same controller retains its recovered edition without depending on browser storage. |

## What already matched and was preserved

- Both pages load Inter. Tickers and status chips are 12px at weight 600; thesis reasons are 14px with 22px line height; edition dates and source links are 12px with 18px line height.
- Page background is #F7F6F2, position surfaces are #FFFFFF, and normal row text is #202824. All four specified status foreground/background pairs match, including WEAKENING checked as a temporary browser test element because no current position has that status. Source links and primary buttons use #254E43.
- The phone signup is fixed to the viewport bottom at 390px. It stays pinned through empty, loading, error, done, validation error, save failure and success. The final contact link remains reachable above it when scrolled to the bottom.
- There is no horizontal overflow at either requested width.
- The first-visit empty thesis displays all 11 inclusion reasons without statuses. A returning visit with no new edition displays the cached latest edition and the existing Saturday 10 AM IST message.
- Row loading has eleven shimmers. A row-load error displays the existing short message and Refresh button; Refresh restores the edition. The done state displays the original edition date.
- The AI landing card opens the thesis. Its preview still uses three real positions and three distinct current statuses, followed by the existing "and 8 more" text. The coming-soon card has no form or saving action.
- The original headline, intro, subscription label, success/error messages, position order, all 11 positions, statuses, inclusion reasons, weekly reasons and source links were preserved. `src/main.js` and `src/portfolio.js` are unchanged.
- "Reach out to Anchit" still points to mailto:anchitgh71@gmail.com. Source links still open in a new tab.
- Email validation, real Convex saving, repeated/concurrent subscription handling and failed-save recovery passed the existing subscription checks. The pre-existing test email was reused; no newsletter sending was added.

## Still needs your decision

These were left unchanged because this task freezes copy and excludes new features.

1. **Landing-page states and signup placement:** DESIGN.md section 4 specifies the thesis page and email edition, but no landing-page empty/loading/error states or landing signup. The landing currently renders a synchronous preview from the same local data as the thesis. Decide whether it should ever have separate edition states or a signup; those would require a new specification.
2. **Thesis product-name placeholder:** The thesis page and browser title still contain [PRODUCT NAME], while the landing says ThesisWatch. Approve changing that existing copy if you want them to match.
3. **Damaged saving label:** The current saving-in-progress label contains garbled characters after "Saving". It predates this audit. Approve restoring the intended ellipsis; no copy was changed in this branch.
4. **ETF names:** GRID, ICLN, FLKR, SMH and QQQ have no full names in the existing position data and display "ETF". Section 4 requests a name per position. Supply or approve their full names before changing the protected data/copy.
5. **Chain explanation:** The chain is currently the four stage labels joined by arrows. If "the chain explained" requires explanatory prose as well, provide or approve that wording.
6. **Row order ambiguity:** Section 2 says name on top and status dot bottom-right; section 4 lists ticker, name, status, reason and Go deeper. Existing rows follow the section 2 placement. Clarify whether section 4 intends a literal visual order before rearranging those elements.
7. **Real edition publication states:** The app has one hardcoded edition and no edition-fetch/publication workflow. Empty, loading and failed-load behavior was checked by supplying controlled responses to the existing edition loader in the browser, not by adding production switches or a backend. Decide how publication should supply those responses in future work.
8. **Other document conflicts/out-of-scope requirements:** IDEA_SCOPE.md still mentions login and custom thesis entry, while PRODUCT.md and the current brief exclude them. DESIGN.md section 1 also mentions changed-this-week markers and edition feedback; change history and feedback controls are absent. None was added. Reconcile the documents and approve a separate scope before building them.

## Verification and evidence

Passed:

- `npm run build`
- `npm test`
- `node scripts/check-edition.mjs` (includes regression checks for these fixes)
- `npm run test:tracking` (served built page and existing Convex subscription path)
- Real-browser audit of both widths, all specified thesis states, Refresh, mobile pinning, laptop visibility, typography, palette, reduced motion, footer visibility and browser errors.

Screenshots and measurements are in [artifacts/overnight](artifacts/overnight/):

- [Landing, 390px](artifacts/overnight/after-landing-390.png)
- [Landing, 1280px](artifacts/overnight/after-landing-1280.png)
- [Thesis done, 390px](artifacts/overnight/after-thesis-done-390.png)
- [Thesis done, 1280px](artifacts/overnight/after-thesis-done-1280.png)
- Separate empty-first, empty-returning, loading, error, signup-validation, signup-error and signup-success captures exist for both widths.
- `before.json` and `after.json` record measured layout/state results.

Limitations: these are desktop Edge viewport checks, not a physical phone/keyboard test. Signup error/success screenshots used controlled save callbacks; actual saving was verified separately by the existing Convex checks. Website copy was not fact-checked or rewritten. Existing uncommitted PRODUCT.md changes and unrelated untracked project files were left untouched.
