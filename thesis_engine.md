\# Vantage — Prebuilt Thesis Research Engine



Build a reusable research engine that generates structured, evidence-backed investment thesis pages.



\## Objective



A financially literate retail investor should be able to click a prebuilt investment thesis and, within approximately 3 minutes, understand:



1\. What is the investment idea?

2\. Why might it happen?

3\. Which publicly traded companies offer exposure, and why?

4\. What assumptions must hold?

5\. What are the major risks?

6\. What would prove or disprove the thesis?

7\. What has changed recently?

8\. Is the thesis strengthening, intact, under watch, or weakening?



The output should feel like a concise investment research memo, not an AI-generated article.



\## Research pipeline



\### Stage 1 — Define the thesis



Inputs:

\- Thesis title

\- One-sentence investment belief

\- Investment horizon

\- Relevant geography and markets

\- Optional user-specified companies



Generate:

\- Clear thesis summary (50–80 words)

\- Structural drivers

\- Investment mechanism: how the trend translates into company earnings or cash flows

\- 3–5 key assumptions

\- 3–5 material risks

\- 2–4 alternative explanations or counterarguments

\- Observable invalidation conditions



Avoid generic claims. Make every assumption testable wherever possible.



\### Stage 2 — Identify investable exposure



Research relevant publicly traded companies.



For each candidate, return:

\- Company name

\- Exchange and ticker

\- Role in the thesis

\- Direct or indirect exposure

\- Evidence supporting the exposure

\- Important company-specific risk

\- Available financial indicators

\- Confidence in the thesis connection



Group companies into logical value-chain or business-model buckets.



Do not select companies merely because they are popularly associated with a trend.



Separate candidate companies from approved thesis constituents.



Do not automatically assign portfolio weights or suggest trades.



\### Stage 3 — Verify research



Use retrieved, dated sources, prioritizing primary company disclosures, regulatory filings, investor presentations, earnings transcripts, and credible independent research.



For every material factual claim, record:

\- Source URL and publisher

\- Publication date

\- Relevant reporting period

\- Supporting evidence

\- Confidence

\- Whether the evidence is current



Never invent sources, prices, financial metrics, historical returns, or citations.



If evidence is insufficient, mark the claim unverified. Do not fill gaps with plausible-looking numbers.



Have a separate verification pass identify contradictions, stale evidence, unsupported causal claims, and missing risks.



\### Stage 4 — Construct the thesis page



Return structured JSON, validated against a schema, containing:



\- thesis\_id

\- title

\- summary

\- investment\_horizon

\- investment\_case

\- structural\_drivers

\- assumptions

\- risks

\- counterarguments

\- stock\_buckets

\- candidate\_companies

\- approved\_constituents

\- invalidation\_conditions

\- monitoring\_indicators

\- current\_status

\- status\_explanation

\- recent\_evidence

\- source\_references

\- last\_verified\_at

\- data\_quality\_flags



Keep the research content separate from the frontend presentation.



\### Stage 5 — Monitor changes



For each thesis, persist its assumptions, approved constituents, monitoring indicators, previous evidence, and previous status.



On each monitoring run:

1\. Retrieve new evidence since the previous successful run.

2\. Determine which assumptions it affects.

3\. Classify evidence as supporting, contradicting, or inconclusive.

4\. Classify materiality as SOFT or HARD.

5\. Identify whether the information is genuinely new.

6\. Compare against prior assessments.

7\. Recommend whether the status should change.

8\. Generate a short, source-backed explanation.

9\. Notify only when the evidence materially changes the thesis assessment or crosses a user-defined threshold.



SOFT means an early, ambiguous, or limited signal that warrants observation.



HARD means material, well-supported evidence directly affecting an important assumption. HARD does not automatically mean the thesis is broken.



Statuses:

\- STRENGTHENING

\- INTACT

\- WATCH

\- WEAKENING



Do not equate stock-price movements with thesis validity.



Do not automatically change a thesis status based on one isolated weak data point.



If evidence is unavailable or stale, disclose insufficient information rather than imply that the thesis is intact.



\### Stage 6 — Quality checks



Before publishing, verify that:

\- The investment mechanism is understandable.

\- Every company has a defensible connection to the thesis.

\- Important risks are not omitted.

\- Assumptions have observable monitoring indicators.

\- Material factual claims are sourced.

\- Counterarguments are concise and decision-relevant.

\- The status follows from evidence rather than narrative sentiment.

\- No unsupported performance chart or portfolio return is displayed.

\- The page can be understood without reading a long report.



If verification fails, keep the thesis in draft/review state.



\## Product constraints



\- Prebuilt theses are the default discovery experience.

\- Users can understand a thesis without writing their own.

\- Users may follow a thesis for continuing updates.

\- Custom thesis creation remains a separate capability.

\- No automatic trading or personalized buy/sell recommendations.

\- No fabricated historical backtests.

\- Prioritize clarity, source quality, and decision relevance over quantity of information.



First implement and evaluate the pipeline for one thesis: AI Infrastructure.



Do not build a separate hardcoded prompt for each thesis. Reuse the same research pipeline and schema.

