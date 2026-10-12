\# DESIGN.md

Read this before building or changing any screen. If a choice isn't covered here, ask me instead of guessing.



\## 1. The feeling, in labels

\- Positions in a fixed order: Energy → Chips → AI Platforms → AI Adopters, A–Z inside each stage. Rows that changed this week get a "changed this week" marker; they never move.

\- Each row: ticker, status, a reason of up to 75 words, and a "go deeper" link.

\- Price direction only, no numbers. No buy, sell or hold language.

\- Every edition ends with a two-button feedback question: "This is enough" / "I need to dig deeper".

\- New edition every Saturday 10 AM IST. No login, no paywall.



\## 2. References, one per component

References guide component layout and styling. Holdings check and results follow our own Lookout reference below; current colours and type are specified in section 3.



Holdings check and results layout: references/inv_thesis_dashboard (our own Lookout design).

Take: dark cards; company header with symbol, exchange/country chips and sector tag; three-step progress card; numbered reasons with status, signal strength, evidence and credited sources together.

Use: the current Lookout dark theme, lime accent and transparent logo; match the holdings reference closely.



Changed-this-week marker: references/gmail-new-pill.png

Take: small pill right next to the label, high contrast

Ignore: Gmail's colours



Go deeper: link on the words "Go deeper", opens the full text on a new page



Email edition top: The Ken

Take: sharp subject line

Ignore: content



Signup box: references/substack-signup.png

Take: one text box with faded "Enter email", Subscribe button right next to it

Ignore: font and colours



\## 3. Type and colour

Font: Inter

Sizes: landing headline 50px desktop / 32px phone, line height 1.03; holdings check/results heading 32-48px, weight 600; company name 30px / 36px desktop and 23px / 28px phone.

Text: #F0F0E7 on dark surfaces; landing secondary text #E1E8E1; holdings form secondary text #A8B7AC; check/results secondary text #B7C5BF; credited source links #D7EABB.

STRENGTHENING: text #245740 on #EAF3ED

INTACT: text #41534A on #EFF2EF

WATCH: text #805719 on #FBF1DD

WEAKENING: text #8B3932 on #F8EBE8

Accent: #DFFA35 lime for primary buttons, active progress indicators, input tags and recent-source counts; primary button text #18251D on the landing page and #131C17 on My holdings.

Errors: holdings messages use readable light text on the current dark surfaces; retain #8B3932 on #F8EBE8 where an existing component already uses that error treatment.

Backgrounds: landing and holdings form #131C17; holdings check/results page #0C1712; form cards #202D24; check/results cards #14221B; reason rows and chips #1B2C23; progress footer #20352A; landing retains the family photo and its existing dark gradient overlay.

Body type: Inter throughout; landing subtitle 16px / 24px desktop and 14px / 21px phone; holdings reason text 16px / 24px; evidence text 14px / 22px.

Detail type: check/results ticker 16px / 24px desktop and 14px on phone, weight 600; status, signal strength, date and source 12px / 18px; recent-source count 14px / 22px, weight 600.

Logo: public/Lookout_brand_logo-transparent.png; transparent icon and wordmark without tagline, 32px high, 160px wide (132px on phone holdings check/results), object-fit contain; link to home with alt text "Lookout".

Cards: 1px borders; form border #41534A with 12px corners and 28px padding (20px on phone); check/results border #3C5147 with 16px corners and 28px 32px padding (22px 18px on phone).

Fields and buttons: fields use #131C17, #63766A borders, 7px corners and 14px padding; holdings buttons use 15px type, weight 600, 14px 18px padding and 46px minimum height; landing button uses 16px type, 8px corners, 11px 22px padding and 44px minimum height, without an outer bordered box.

Chips and reason rows: rounded exchange, country and sector chips with #3C5147 borders; numbered reason rows have 12px corners, 18px 20px padding (16px 14px on phone), and circles filled #354940.

No new evidence badge: text #C3D0C8 on #354940; all status badges use 4px corners and 4px 10px padding; the four existing status palettes above remain in use.

Progress styling: lime ring and active/completed step dots, three named steps, a visible "Step x of 3" footer, and a lime recent-source count on completed results; footer border #41594B with 12px corners; respect reduced-motion settings.

Visual layout: landing headline, subtitle and standalone button are centred; holdings check/results use stacked company/progress and numbered-reason cards, followed by the horizon note and Saturday email card; maximum content width 1220px, with 40px desktop and 18px phone horizontal padding.



\## 4. Screens



Thesis page

For: seeing which stocks and ETFs the AI thesis rests on, how each maps to a stage of the chain, and why each is included.

Top to bottom: headline (section 5) → "Edition dated \[date]" → the chain explained (Energy → Chips → AI Platforms → AI Adopters) → each stage with its positions: ticker, name, status, why it's included, Go deeper → "Reach out to Anchit" button at the bottom.

Signup box: on the left side on laptop, always visible; pinned to the bottom on phone.

Main action: "Subscribe to this thesis" → saves the email and shows "You're on the list".

Empty, first visit: no edition published yet. Show the chain and the positions with why each is included, without statuses.

Empty, coming back: show the latest edition and say the next one lands Saturday 10 AM IST.

Loading: shimmer boxes in the shape of the rows.

Error: rows failed to load. Short message plus a Refresh button.

Done: edition showing, dated at the top.

If the AI is wrong: "Reach out to Anchit" button at the bottom opens an email to anchitgh71@gmail.com.



Email edition

For: seeing which stocks and ETFs have movement in status , basis the news / alerts set up

Top to bottom: For each stock, a status and why that status. example : \*\*AMZN\*\* — INTACT — Amazon backing X-Energy (nuclear startup) to power AI data center growth — confirms AWS infrastructure buildout is real and long-dated. Indirect bullish signal for AWS capex thesis.



\*\*AAPL\*\* — WATCH — Apple sued OpenAI for trade secret theft, alleging a coordinated campaign to extract product information via a departing hardware engineer. Separately, Apple signed a $30B deal with Broadcom to reshape US semiconductor supply chains. The lawsuit creates execution risk and management distraction at a moment when Apple Intelligence rollout is critical to the services thesis. The Broadcom deal is a positive long-term supply chain signal. Net: monitor closely, not a thesis break yet.

And unexpected connections section that talks deeper about why the thesis is going strong or weak

Main action: Feedback at the end, unsubscribe flow at the end





\## 5. The first screen's words

Headline: Stay on top of your investment thesis without drowning in 50 tabs

Under it: Every Saturday, get an email on the AI thesis, stock by stock. 5 minutes is all it takes.

