// Reference: PORTFOLIO in bio-newsletter/config.py. No newsletter code is used.
export const groups = ['Energy', 'Chips', 'AI Platforms', 'AI Adopters'];
export const portfolio = [
  { ticker: 'ICLN', group: 'Energy', thesis: 'Global clean energy — benefits from data center power demand, nuclear renaissance, energy transition', drivers: ['clean energy', 'nuclear power', 'data center energy', 'renewable energy policy', 'power grid', 'Bloom Energy', 'First Solar'] },
  { ticker: 'GRID', group: 'Energy', thesis: 'Grid infrastructure — Vertiv, Quanta, Schneider, Eaton, ABB. Data center power and cooling.', drivers: ['grid infrastructure', 'Vertiv', 'Quanta Services', 'power infrastructure', 'liquid cooling', 'data center cooling', 'ABB', 'Eaton', 'Schneider'] },
  { ticker: 'CEG', name: 'Constellation Energy', group: 'Energy', thesis: 'Largest US nuclear operator. Long-term data center power contracts.', drivers: ['nuclear power contracts', 'data center energy', 'Calpine acquisition', 'Crane nuclear restart', 'Constellation Energy'] },
  { ticker: 'SMH', group: 'Chips', thesis: 'Semiconductor ETF — Nvidia, TSMC, AMD, Broadcom. Benefits from AI chip demand supercycle', drivers: ['semiconductor supply', 'HBM memory', 'chip demand', 'Nvidia', 'TSMC', 'AMD', 'Broadcom', 'fab capacity', 'AI chips', 'NAND'] },
  { ticker: 'FLKR', group: 'Chips', thesis: 'South Korea — Samsung + SK Hynix HBM memory chips for AI.', drivers: ['SK Hynix', 'Samsung memory', 'HBM demand', 'Korean semiconductor', 'DRAM pricing', 'memory supercycle', 'South Korea AI'] },
  { ticker: 'QQQ', group: 'AI Platforms', thesis: 'Broad Nasdaq tech exposure — benefits from AI platform growth, big tech earnings', drivers: ['big tech earnings', 'AI capex', 'cloud revenue', 'Nasdaq', 'Microsoft Azure', 'Google Cloud', 'AWS'] },
  { ticker: 'MSFT', name: 'Microsoft', group: 'AI Platforms', thesis: 'Azure AI cloud + OpenAI partnership. Core compounder.', drivers: ['Azure revenue', 'Microsoft earnings', 'OpenAI', 'enterprise AI', 'cloud growth', 'Copilot'] },
  { ticker: 'GOOG', name: 'Alphabet / Google', group: 'AI Platforms', thesis: 'AI + search dominance + Google Cloud. Antitrust headwind watch.', drivers: ['Google earnings', 'Gemini AI', 'Google Cloud', 'search revenue', 'antitrust', 'YouTube'] },
  { ticker: 'AMZN', name: 'Amazon', group: 'AI Platforms', thesis: 'AWS cloud dominance + Anthropic investment + retail recovery.', drivers: ['AWS revenue', 'Amazon earnings', 'Anthropic', 'cloud infrastructure', 'AWS AI'] },
  { ticker: 'TSLA', name: 'Tesla', group: 'AI Adopters', thesis: 'EV + energy storage + autonomous driving.', drivers: ['Tesla earnings', 'EV demand', 'Megapack', 'autonomous driving', 'energy storage', 'robotaxi'] },
  { ticker: 'AAPL', name: 'Apple', group: 'AI Adopters', thesis: 'Services growth + Apple Intelligence + installed base monetisation.', drivers: ['Apple earnings', 'iPhone demand', 'Apple Intelligence', 'services revenue', 'Vision Pro'] },
];

// Filled only with the founder's supplied weekly assessments.
export const weeklyAssessments = {
  QQQ: { status: 'INTACT', reason: 'Big tech AI capex on track; $720-745B committed across hyperscalers in 2026', source: 'https://futurumgroup.com/insights/ai-capex-2026-the-690b-infrastructure-sprint/' },
  ICLN: { status: 'INTACT', reason: '18 nuclear reactors coming online for AI demand in 2026', source: 'https://carboncredits.com/2026-the-year-nuclear-power-reclaims-relevance/' },
  SMH: { status: 'STRENGTHENING', reason: 'Micron guided memory shortages worsening through 2028', source: 'https://winbuzzer.com/2026/10/01/memory-maker-micron-sees-shortages-worsening-through-2028-xcxwbn/' },
  FLKR: { status: 'STRENGTHENING', reason: 'SK Hynix: HBM shortage may last past 2030; HBM3E prices up ~20%', source: 'https://tech-insider.org/memory-chip-shortage-2026-ai-consumer-electronics/' },
  GRID: { status: 'STRENGTHENING', reason: 'BlackRock GIP + Microsoft-backed AIP acquire Aligned Data Centers for $40B', source: 'https://www.esgdive.com/news/blackrocks-gip-microsoft-backed-ai-group-buy-aligned-data-centers-for-40/825920/' },
  CEG: { status: 'STRENGTHENING', reason: 'Amazon signed 20-year $3B nuclear PPA — contractual confirmation of thesis', source: 'https://www.benzinga.com/markets/tech/26/10/62097215/amazon-constellation-nuclear-power-deal-ai-electricity-demand-3-billion' },
  TSLA: { status: 'WATCH', reason: 'Q3 deliveries -2.1% YoY; energy storage growth slowing to 10.5% YoY', source: 'https://www.teslaoracle.com/2026/10/03/tesla-tsla-q3-2026-vehicle-deliveries-grew-1-3-qoq-and-dropped-by-2-1-yoy-energy-business-also-slows-down/' },
  MSFT: { status: 'INTACT', reason: 'Part of $40B Aligned Data Centers consortium', source: 'https://www.esgdive.com/news/blackrocks-gip-microsoft-backed-ai-group-buy-aligned-data-centers-for-40/825920/' },
  GOOG: { status: 'WATCH', reason: 'DOJ antitrust appeal ongoing; Gemini 4 Argon launched (positive); Chrome divestiture risk', source: 'https://tech-insider.org/google-antitrust-appeal-doj-search-monopoly-2026/' },
  AMZN: { status: 'STRENGTHENING', reason: 'Signed 20-year nuclear PPA; locking baseload power for AWS AI expansion', source: 'https://www.benzinga.com/markets/tech/26/10/62097215/amazon-constellation-nuclear-power-deal-ai-electricity-demand-3-billion' },
  AAPL: { status: 'WATCH', reason: 'AI chip shortage forcing price hikes on iPhone, Mac, iPad; Tim Cook confirmed', source: 'https://gulfnews.com/amp/story/technology/apple-to-raise-iphone-mac-and-ipad-prices-aidriven-chip-shortage-forces-unavoidable-hike-1.500578158' },
};
