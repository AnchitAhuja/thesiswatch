// Explicit official domains: a page calling itself a press release is not proof
// that an unknown domain belongs to the company or an established publisher.
export const SOURCE_POLICY_VERSION = 'ranked-publishers-v2';
const blocked = ['brandiconimage.com'];
const outlets = ['reuters.com','bloomberg.com','economictimes.indiatimes.com','livemint.com','business-standard.com','moneycontrol.com','techradar.com','theverge.com','ft.com','wsj.com','cnbc.com','cnbctv18.com'];
const filings = ['sec.gov','sebi.gov.in','nseindia.com','bseindia.com','fca.org.uk','londonstockexchange.com','nasdaq.com'];
const companies = ['amd.com','nvidia.com','intel.com','tsmc.com','micron.com','samsung.com','samsungsemiconductor.com','asml.com','broadcom.com','microsoft.com','amazon.com','aboutamazon.com','google.com','abc.xyz','meta.com','fb.com','oracle.com','openai.com','anthropic.com','equinix.com','digitalrealty.com','schneider-electric.com','se.com','vertiv.com','gevernova.com','siemens-energy.com','eaton.com','constellationenergy.com','duke-energy.com','dominionenergy.com','nexteraenergy.com','aep.com','southerncompany.com','tata.com','tatapower.com','ntpc.co.in','powergrid.in','adani.com','adanipower.com','relianceindustries.com','ril.com'];
export const SEARCH_DOMAINS = [...companies,...filings,...outlets];
const matches = (host, domains) => domains.some(domain => host === domain || host.endsWith('.' + domain));
export function sourceQuality(url) {
 try {
  const parsed = new URL(url), host = parsed.hostname.toLowerCase();
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return null;
  if (matches(host, blocked)) return null;
  if (matches(host, filings) && /(?:filing|edgar|archives|disclosure|announcement|regulation|circular|report|news)/i.test(parsed.pathname)) return 'primary';
  if (matches(host, companies) && (/(?:press|news|release|investor|report|financial|earning|media)/i.test(parsed.pathname) || /^(?:ir|investor|investors|news|newsroom|press)\./i.test(host))) return 'primary';
  if (matches(host, outlets)) return 'outlet';
  return 'other';
 } catch { return null; }
}
