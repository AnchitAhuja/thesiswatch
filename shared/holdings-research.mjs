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
export const HOLDINGS_ASSESSMENT_VERSION = 'direct-reason-match-paragraphs-v2';
export function gateReasonMatch(row, review, sources) {
 if (!review || !['direct','indirect','unrelated'].includes(review.match)) throw Error('Invalid reason match review.');
 if (review.match !== 'direct' || !row.sourceUrls.length) return {...row,status:'No new evidence',signalStrength:'soft',reason:'no clear evidence in the last 30 days',sourceUrls:[],brokerageEvidence:[]};
 const normalize=text=>text.replace(/\s+/g,' ').trim();
 if (!Array.isArray(review.quotes) || !review.quotes.length) throw Error('Missing direct evidence quote.');
 const supported=new Set(),brokerageEvidence=[],statements=[];
 for(const item of review.quotes){
  const source=sources.find(source=>source.url===item.sourceUrl);
  if(!source || !row.sourceUrls.includes(item.sourceUrl) || typeof item.quote!=='string' || normalize(item.quote).length<15 || !normalize(source.excerpt).includes(normalize(item.quote)))throw Error('Unverified direct evidence quote.');
  supported.add(item.sourceUrl);
  if(item.firm){
   if(!source.excerpt.toLowerCase().includes(item.firm.toLowerCase()))throw Error('Unverified brokerage attribution.');
   brokerageEvidence.push({firm:item.firm,sourceUrl:item.sourceUrl,reasoning:item.quote});
   statements.push(`${item.firm} (reported ${source.date}) stated: ${item.quote}`);
  }else statements.push(`${source.publisher} (reported ${source.date}): ${item.quote}`);
 }
 if(row.sourceUrls.some(url=>!supported.has(url)))throw Error('A cited source lacks a direct evidence quote.');
 const reason=statements.join(' ');
 if(reason.length>500)throw Error('Direct evidence quotation is too long.');
 return {...row,brokerageEvidence:[],reason,signalStrength:brokerageEvidence.length?'soft':row.signalStrength};
}
