import {holdingsQueries} from './holdings-research.mjs';
import {publication} from './standing.mjs';
export function recentQueries(company,reasons,end) {
 const month=new Date(end+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
 return holdingsQueries(company,reasons).map(query=>query+' '+month);
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
export function recoverPublication(html,url) {
 const metadata=publication(html);
 if(metadata)return {date:metadata,verification:'Publisher page datePublished / publication metadata'};
 // Conflicting publication metadata is not repaired using a convenient URL date.
 if(/datePublished|article:published_time|pubdate|publish-date/i.test(html))return {date:null,verification:'Conflicting or invalid publication metadata'};
 const dates=new Set();
 for(const tag of html.match(/<time\b[^>]*>[\s\S]*?<\/time>/gi)||[]) {
  if(/modified|updated/i.test(tag))continue;
  const m=tag.match(/(?:datetime=["']|\b)(\d{4})-(\d{2})-(\d{2})/i);
  if(m){const value=day(+m[1],+m[2],+m[3]);if(value)dates.add(value);}
 }
 const visible=html.replace(/<(script|style|nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
 const dateText='(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)';
 const contexts=[...visible.matchAll(new RegExp('(?:published|posted|publication date)\\s*(?:on|at|:)?:?\\s*('+dateText+'\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}\\s+'+dateText+',?\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2})','gi'))].map(m=>m[1]);
 for(const text of contexts){
  const iso=text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parts=text.toLowerCase().replace(/,/g,'').split(/\s+/);
  const month=months.findIndex(name=>name.startsWith(parts.find(part=>/^[a-z]+$/.test(part))||'!'))+1;
  const numeric=parts.filter(part=>/^\d+$/.test(part));
  const value=iso?day(+iso[1],+iso[2],+iso[3]):day(+numeric.find(n=>n.length===4),month,+numeric.find(n=>n.length<4));
  if(value)dates.add(value);
 }
 if(dates.size>1)return {date:null,verification:'Conflicting publication dates in page text'};
 if(dates.size===1)return {date:[...dates][0],verification:'Publisher visible publication date / time element'};
 for(const m of url.matchAll(/(?:\/|-)(20\d{2})[-/](\d{2})[-/](\d{2})(?=[-/._?]|$)/g)){const value=day(+m[1],+m[2],+m[3]);if(value)dates.add(value);}
 return {date:dates.size===1?[...dates][0]:null,verification:dates.size===1?'Publication date encoded in publisher URL':'Publication date unverified'};
}
