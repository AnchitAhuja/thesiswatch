import {publication} from './standing.mjs';
export function recentQueries(company,_reasons,end) {
 const name=company.replace(/\s+(?:limited|ltd\.?|inc\.?)$/i,'').trim();
 const month=new Date(end+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
 return ['results','partnership OR deal OR order','news','brokerage target'].map(topic=>`${name} ${topic} ${month}`);
}
export function skipResearchPage(url,title='') {
 return /(?:wikipedia\.org|britannica\.com|crunchbase\.com|zoominfo\.com|enlyft\.com|startupintros\.com|highperformr\.ai|tracxn\.com|naukri\.com|indeed\.com|glassdoor\.com|play\.google\.com|apps\.apple\.com|softonic\.com|franchisebazar\.com)/i.test(url)
  || /\/(?:wiki|company-profile|company-profiles|orgs|jobs|careers|franchise|interview-bundle)(?:\/|\?|$)/i.test(url)
  || /\b(?:company profile|encyclop[ae]edia|job vacancies|app store|franchise opportunities)\b/i.test(title);
}
const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
function day(year,month,date) {
 const value=`${year}-${String(month).padStart(2,'0')}-${String(date).padStart(2,'0')}`;
 const stamp=Date.parse(value+'T12:00:00Z');
 return Number.isFinite(stamp)&&new Date(stamp).toISOString().slice(0,10)===value?value:null;
}
function dateIn(text) {
 if(typeof text!=='string')return null;
 const iso=text.match(/\b(20\d{2})[-/](\d{2})[-/](\d{2})(?:\b|T)/);
 if(iso)return day(+iso[1],+iso[2],+iso[3]);
 const names='January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec';
 const m=text.match(new RegExp('\\b('+names+')\\.?\\s+(\\d{1,2}),?\\s+(20\\d{2})\\b','i'));
 const d=text.match(new RegExp('\\b(\\d{1,2})\\s+('+names+')\\.?,?\\s+(20\\d{2})\\b','i'));
 if(!m&&!d)return null;
 const name=(m?m[1]:d[2]).toLowerCase();
 return day(+(m?m[3]:d[3]),months.findIndex(month=>month.startsWith(name))+1,+(m?m[2]:d[1]));
}
/** @param {string|null} searchDate */
export function recoverPublication(html,url,searchDate=null,referenceDay=new Date().toISOString().slice(0,10)) {
 const metadata=publication(html);
 if(metadata&&dateIn(metadata)===metadata)return {date:metadata,verification:'Publisher page datePublished / publication metadata'};
 let searched=dateIn(searchDate);
 const relative=typeof searchDate==='string'?searchDate.match(/^\s*(\d+)\s+days?\s+ago\s*$/i):null;
 if(!searched&&relative&&dateIn(referenceDay))searched=new Date(Date.parse(referenceDay+'T12:00:00Z')-Number(relative[1])*86400000).toISOString().slice(0,10);
 if(searched)return {date:searched,verification:'Search result publication date'};
 const urlDate=dateIn(url);
 if(urlDate)return {date:urlDate,verification:'Publication date encoded in publisher URL'};
 // Limit text recovery to the opening visible lines, not dates in the article body.
 let visible=html.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+\b(?:hidden|aria-hidden=["']true["'])[^>]*>[\s\S]*?<\/[^>]+>/gi,' ');
 visible=visible.replace(/<time\b[^>]*datetime=["']([^"']+)["'][^>]*>/gi,'\n$1 ')
  .replace(/<\/?(?:p|h[1-6]|div|article|section|main|time)\b[^>]*>|<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ');
 const firstLines=visible.split(/\r?\n/).map(line=>line.replace(/\s+/g,' ').trim()).filter(Boolean).slice(0,30).join('\n').slice(0,4000);
 const pageDate=dateIn(firstLines);
 return {date:pageDate,verification:pageDate?'First visible page lines':'Publication date unverified'};
}
