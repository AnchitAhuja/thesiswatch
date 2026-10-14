import {matchStock} from './stock-matching.mjs';
// Explicit company-owned domains; never infer ownership from a publisher URL.
const domains={'US:NVDA':'nvidia.com','IN:DELHIVERY':'delhivery.com','IN:BAJAJ-AUTO':'bajajauto.com'};
export function companyAliasMatch(company,title,excerpt,url='') {
 const stock=matchStock(company);
 const full=stock?.name||company;
 const short=full.replace(/(?:\s+(?:limited|ltd\.?|incorporated|inc\.?|corporation|corp\.?|plc))+\s*$/i,'').trim();
 const domain=domains[stock?.id];
 if(domain){try{const host=new URL(url).hostname.toLowerCase();if(host===domain||host.endsWith('.'+domain))return {alias:domain,kind:'domain'};}catch{}}
 const text=title+'\n'+excerpt;
 for(const [kind,alias] of [['fullName',full],['shortName',short],['ticker',stock?.ticker]]){
  if(!alias)continue;
  const escaped=alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(new RegExp('(?<![a-z0-9])'+escaped+'(?![a-z0-9])','i').test(text))return {alias,kind};
 }
 return null;
}
