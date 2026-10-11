export const HOLDINGS_RESEARCH_VERSION = 'reason-search-v2';
const stop = new Set('a an the one of few it is are able to bring good and or for in on with that this its their my i because very'.split(' '));
export function holdingsQueries(company, reasons) {
 const name = company.replace(/\s+(?:limited|ltd\.?|inc\.?)$/i, '').trim();
 const queries = reasons.map(reason => {
  const words = [...new Set((reason.toLowerCase().match(/[a-z0-9]+/g) || []).filter(word => !stop.has(word)))].slice(0,3);
  if (!words.length) throw Error('This reason has no searchable keywords. Please clarify it.');
  return name + ' ' + words.join(' ');
 });
 return [...new Set([...queries, name+' brokerage report', name+' quarterly results'])];
}
export function assertSearchRan(calls, query) {
 if (!calls.some(call => call.toolName === 'web_search' && call.input?.query === query)) throw Error('Required holdings search did not run: '+query);
}
export function attributeBrokerage(row, sources) {
 if (!Array.isArray(row.brokerageEvidence)) throw Error('Missing brokerage attribution check.');
 if (!row.brokerageEvidence.length) return row;
 const statements=row.brokerageEvidence.map(item=>{
  const source=sources.find(source=>source.url===item.sourceUrl);
  if (!source || !row.sourceUrls.includes(item.sourceUrl) || !item.firm?.trim() || !item.reasoning?.trim() || !source.excerpt.toLowerCase().includes(item.firm.toLowerCase())) throw Error('Unverified brokerage attribution.');
  return `${item.firm} (reported ${source.date}) stated: ${item.reasoning}`;
 });
 const reason=statements.join(' ');
 if(reason.length>500)throw Error('Brokerage attribution is too long.');
 return {...row,reason,signalStrength:'soft'};
}
