What I saw in 5 user calls: investors could name what they owned but struggled to say why in a sentence. Jayanth wanted "someone watching" and a weekly on-track-or-red summary, but only trusts it with sources.



Monitoring today: there is no news engine yet. The 11 statuses were written by hand. Build a weekly Convex job that fetches recent news for each stock in a thesis, has the AI draft a status with sources, and holds each draft for my approval before any user sees it. Cap AI calls per run and say so in the plan.



Users may start from one holding they already own and explain why they bought it, in their own words.

# Lookout — Thesis Capture and Monitoring Redesign



You are working on Lookout, an AI-powered investment thesis monitoring product under the Vantage brand.



\## Product context



Lookout helps retail investors understand whether the original reasoning behind their investments is still valid.



Our target users are thoughtful retail investors who have investment opinions but lack the time to continuously research and validate them.



\*\*Core insight:\*\* Most investors have a reason for investing, but cannot articulate that reason as a structured investment thesis.



For example, a user might say:



"I'm bullish on AI. Adoption keeps increasing, Nvidia apparently has supply booked until 2030, and companies are spending heavily on AI infrastructure."



This is a perfectly valid starting point.



We should NOT expect users to define four assumptions, create research frameworks, or understand investment terminology.



Lookout should do the intellectual structuring internally.



\## First: inspect the existing codebase



Before making changes:



1\. Understand the current product architecture and user flows.

2\. Identify how theses, assumptions, holdings, evidence, and status classifications are represented.

3\. Identify existing LLM integrations and monitoring logic.

4\. Identify reusable components.

5\. Summarize the current flow and proposed changes briefly before implementing.



Preserve existing functionality wherever possible. Do not rebuild the application unnecessarily.



\## 1. Redesign thesis creation



Replace any assumption-heavy onboarding with a conversational flow.



The initial experience should ask:



\*\*"What's an investment belief you want to keep an eye on?"\*\*



Supporting text:



"Tell us what you believe and why, in your own words. You don't need to have it all figured out."



Allow users to enter free-form text.



Example:



"I think AI infrastructure will continue growing because companies are spending billions on AI and demand for Nvidia chips seems unstoppable."



Do not ask users to manually list assumptions.



Do not introduce unnecessary forms or multi-step questionnaires.



\## 2. Build an internal thesis interpretation layer



After receiving the user's explanation, use the existing LLM integration to interpret it.



Extract and store:



\- Original user statement, verbatim.

\- Core investment belief.

\- Supporting reasoning explicitly provided by the user.

\- Underlying assumptions inferred by the AI.

\- Key uncertainties or risks.

\- Potential evidence that could strengthen or weaken the thesis.

\- Relevant companies, sectors, or assets, where appropriate.



Critically, distinguish between:



\*\*User-stated beliefs:\*\* What the investor actually said.



\*\*AI-inferred assumptions:\*\* What would need to be true for the investor's reasoning to hold.



\*\*Unverified factual claims:\*\* Statements such as "Nvidia is booked until 2030" that require independent validation.



Never silently convert an inferred assumption into something the user explicitly believes.



Do not invent certainty.



Keep this structured representation persistent so it can support future monitoring.



Use existing data models and migrations where possible.



\## 3. Reflect the thesis back naturally



Do not display a long list of assumptions.



Instead, present a concise interpretation:



\*\*"Here's what I think you're betting on."\*\*



Example:



"You're betting that demand for AI computing will keep growing, companies will continue investing heavily in infrastructure, and suppliers like Nvidia will benefit."



Then ask:



\*\*"Does that sound right?"\*\*



Provide simple ways to confirm or edit the interpretation.



Keep deeper assumptions accessible in a secondary details view, not as the primary interface.



\## 4. Connect beliefs to investments



A thesis is not the same as a stock.



A user can believe in AI growth while holding Nvidia, Microsoft, an ETF, or no investments at all.



Preserve that distinction in the data model.



Allow a thesis to be linked to multiple holdings or instruments, but don't require portfolio integration.



If a user hasn't selected an investment, the thesis should still be valid and monitorable.



Do not build brokerage integrations in this iteration.



\## 5. Preserve and improve evidence monitoring



The product's central value is not simply storing a thesis.



It is identifying meaningful developments that change the investment reasoning.



Evidence should be evaluated against the underlying thesis, rather than merely detecting news mentioning a ticker.



Each meaningful update should communicate:



\- What changed.

\- Why it matters to the user's belief.

\- Whether it strengthens, weakens, or leaves the thesis intact.

\- The source and date.

\- Any uncertainty in the interpretation.



Preserve the existing four-status system:



\- STRENGTHENING

\- INTACT

\- WATCH

\- WEAKENING



Do not treat every positive news article as strengthening or every negative headline as weakening.



Status should reflect the effect on the user's thesis.



Preserve source attribution and avoid fabricating evidence.



\## 6. Make monitoring feel effortless



The core user action should be:



\*\*"Keep an eye on this for me."\*\*



After thesis confirmation, provide a clear action to start tracking.



A user should feel that Lookout understands what they believe and will help them notice when something important changes.



Do not promise continuous or background monitoring unless the backend actually supports it.



If monitoring is currently manual or scheduled, preserve its actual behavior and communicate that accurately.



\## 7. Design requirements



Maintain the existing premium fintech design direction, inspired by the clarity and restraint of Revolut, Scapia, and CRED.



Prioritize:



\- Minimal cognitive load.

\- Strong typography and hierarchy.

\- Concise, confident language.

\- High information density without clutter.

\- Credible evidence presentation.

\- Clear distinction between facts, interpretations, and uncertainty.



Avoid:



\- Generic AI chatbot interfaces.

\- Long onboarding forms.

\- Research dashboards filled with metrics.

\- Excessive status badges.

\- Technical language like "assumption extraction" in the primary UI.

\- Unnecessary animations or decorative components.



The experience should feel like a thoughtful investment analyst who remembers your reasoning, not a stock-news aggregator.



\## 8. Scope and implementation priorities



Implement in this order:



1\. Free-form thesis capture.

2\. AI interpretation and structured persistence.

3\. Natural-language thesis reflection and confirmation.

4\. Connection between thesis and relevant investments.

5\. Integration with the existing monitoring and evidence interface.



Reuse existing components, services, and design tokens.



Do not introduce new dependencies unless necessary.



Do not implement payments, brokerage connections, portfolio imports, email newsletters, or unrelated features.



\## 9. Acceptance criteria



The implementation should support this end-to-end scenario:



A user opens Lookout and types:



"I think AI will keep growing because everyone is adopting it, Nvidia has years of demand lined up, and big tech companies are spending heavily."



Lookout:



1\. Understands the underlying investment belief.

2\. Preserves what the user actually said.

3\. Separates inferred assumptions from stated beliefs.

4\. Flags unverified claims appropriately.

5\. Reflects the interpretation in natural language.

6\. Allows the user to confirm or correct it.

7\. Saves the thesis persistently.

8\. Allows the user to opt into tracking it.

9\. Uses the thesis to contextualize future evidence.



Test the changed flows and existing monitoring functionality.



At completion, provide:



\- Summary of changes.

\- Files modified.

\- Any database migrations.

\- Tests executed and their results.

\- Known limitations.

\- Any functionality requiring external APIs or credentials.



\*\*Product principle:\*\*



The investor provides the conviction. Lookout does the structuring, remembers the reasoning, and watches for evidence that could change their mind.

