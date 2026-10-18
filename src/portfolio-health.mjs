import {ConvexHttpClient} from 'convex/browser';
import {whyFacts,validWhySentence,validateWhyNotes,uploadNoteBatch} from '../shared/portfolio-why.mjs';
import {api} from '../convex/_generated/api.js';
import {parsePortfolioSheets,portfolioFlags,portfolioFacts,factualSummaries,sectorTotals,unsafeCopy} from '../shared/portfolio-health.mjs';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=value=>value===null?'Not in statement':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
export const moneyTotal=value=>value===null?'Not in statement':Math.abs(value)>=1e7?`${value<0?'-':''}₹${(Math.abs(value)/1e7).toFixed(2)}Cr`:Math.abs(value)>=1e5?`${value<0?'-':''}₹${(Math.abs(value)/1e5).toFixed(2)}L`:money(value);
const pct=value=>value===null?'—':`${value>=0?'+':''}${value.toFixed(1)}%`;
export async function readPortfolioFile(file){
 if(!file||! /\.xlsx$/i.test(file.name)||file.size>10*1024*1024)throw Error('Choose an .xlsx file smaller than 10 MB.');
 const {default:readExcelFile}=await import('read-excel-file/browser');
 return parsePortfolioSheets(await readExcelFile(file));
}
function bars(rows,limit=null){
 const max=Math.max(limit||0,...rows.map(row=>row.weight),1);
 return `<div class="ph-bars" role="img" aria-label="${limit===null?'Sector allocation':'Top 12 positions; dashed line at '+limit+'%'}">${rows.map(row=>`<div class="ph-bar-row"><span>${esc(row.name)}</span><div class="ph-bar-track"><div class="ph-bar-fill" style="width:${row.weight/max*100}%"></div>${limit===null?'':`<i class="ph-limit-line" style="left:${limit/max*100}%" aria-hidden="true"></i>`}</div><strong>${row.weight.toFixed(1)}%</strong></div>`).join('')}</div>`;
}
export function renderPortfolioReport(portfolio,{limit=5,sectors={},summary=null,sectorState='ready',summaryState='ready',whyNotes={},whyState='loading',errors={}}={}){
 const largest=portfolio.entries[0],small=portfolio.entries.filter(row=>row.weight<0.5),smallValue=small.reduce((sum,row)=>sum+row.value,0);
 const facts=portfolioFacts(portfolio),fallback=factualSummaries(facts)[0];
 // Never render arbitrary generated copy. The model may choose only verified factual phrasings.
 const line=summary&&!unsafeCopy.test(summary)&&factualSummaries(facts).includes(summary)?summary:fallback;
 const grouped=new Map();
 for(const row of portfolioFlags(portfolio,limit,sectors)){
  const existing=grouped.get(row.symbol);
  if(existing){if(!existing.flags.includes(row.flag))existing.flags.push(row.flag);}
  else grouped.set(row.symbol,{...row,flags:[row.flag]});
 }
 const flags=[...grouped.values()];
 const devError=key=>import.meta.env.VITE_CONVEX_URL==='https://fearless-ferret-257.convex.cloud'&&errors[key]?`<small class="ph-ai-error" role="status">${esc(errors[key])}</small>`:'';
 const noteFacts=new Map(whyFacts(portfolio).map(row=>[row.id,row]));
 const whyText=row=>validWhySentence(whyNotes[row.noteId],noteFacts.get(row.noteId))?whyNotes[row.noteId]:whyState==='error'?(devError('why')?'—':'Factual note unavailable.'):'Writing factual note?';
 const metrics=[['Portfolio value',moneyTotal(portfolio.total)],['Invested',moneyTotal(portfolio.invested)],['Unrealised gain',moneyTotal(portfolio.gain),pct(portfolio.gainPct)],['Holdings count',String(portfolio.entries.length)],['Largest position',largest?`${largest.weight.toFixed(1)}%`:'—',largest?largest.symbol:'No current positions']];
 return `<header class="ph-report-heading"><h1>Your portfolio health card</h1><p class="ph-summary">${esc(line)}</p>${summaryState==='loading'?'<p class="ph-muted" role="status">Writing the factual summary…</p>':summaryState==='error'&&!devError('summary')?'<p class="ph-muted">The summary service is unavailable. The statement facts are shown above.</p>':''}</header>
 ${summaryState==='error'?devError('summary'):''}<div class="ph-metrics">${metrics.map(([label,value,detail])=>`<article><h2>${label}</h2><p><span class="ph-metric-value">${esc(value)}</span>${detail?`<span class="ph-metric-detail">${esc(detail)}</span>`:''}</p></article>`).join('')}</div>
 <section aria-labelledby="ph-worth"><div class="ph-section-heading"><h2 id="ph-worth">Worth a look</h2><label>Position limit (%) <input id="ph-limit" type="number" min="0.1" max="100" step="0.1" value="${limit}" inputmode="decimal"></label></div>
 <p class="ph-muted">Rows in broker review are excluded from portfolio totals.</p>
 ${whyState==='error'?devError('why'):''}<div class="ph-table-wrap" tabindex="0" aria-label="Portfolio flags"><table><thead><tr><th scope="col">Stock</th><th scope="col">Flag</th><th scope="col">Value</th><th scope="col">Return</th><th scope="col">Why</th></tr></thead><tbody>${flags.map(row=>`<tr><th scope="row">${esc(row.symbol)}</th><td>${esc(row.flags.join(' · '))}</td><td>${esc(money(row.value))}</td><td>${esc(pct(row.returnPct))}</td><td>${esc(whyText(row))}</td></tr>`).join('')||'<tr><td colspan="5">No positions meet these flag thresholds.</td></tr>'}</tbody></table></div></section>
 <section aria-labelledby="ph-money"><h2 id="ph-money">Where the money sits</h2><div class="ph-chart-grid"><article><h3>Top 12 holdings</h3><p class="ph-muted">Dashed line: ${limit}% limit</p>${bars(portfolio.entries.slice(0,12).map(row=>({name:row.symbol,weight:row.weight})),limit)}</article><article><h3>By sector</h3>${sectorState==='loading'?'<p role="status">Finding sectors from symbols…</p>':sectorState==='error'?`${devError('sectors')||'<p role="status">Sector lookup is unavailable. Try the sector lookup again.</p>'}<button type="button" id="ph-sector-retry">Retry sector lookup</button>`:bars(sectorTotals(portfolio,sectors))}<p class="ph-muted">Sector labels are AI classified; unknown symbols are Other.</p></article></div></section>
 <section aria-labelledby="ph-small"><h2 id="ph-small">Small positions</h2><p class="ph-small-total">${small.length} under 0.5% each</p><p>${esc(moneyTotal(smallValue))} · ${(portfolio.total?smallValue/portfolio.total*100:0).toFixed(2)}% of portfolio</p>${small.length?`<details class="ph-small-names"><summary>View names (${small.length})</summary><ul>${[...new Set(small.map(row=>row.symbol))].map(symbol=>`<li>${esc(symbol)}</li>`).join('')}</ul></details>`:''}</section>
 <section aria-labelledby="ph-account"><h2 id="ph-account">Account this year</h2><dl class="ph-account">${[['Realised P&L',portfolio.account.realised],['Trading charges',portfolio.account.charges],['Other debits',portfolio.account.other],['Delayed payment charges',portfolio.account.delayed]].map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(money(value))}</dd></div>`).join('')}</dl>${portfolio.account.delayed>0?'<p class="ph-charge-note">Delayed payment charges mean the trading balance went below zero.</p>':''}</section>
 <footer>Facts from your broker statement. Not investment advice.</footer>`;
}
export function bindPortfolioHealth(root,providedClient=null){
 document.body.classList.add('portfolio-health-body');
 const client=providedClient||new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL,{logger:false});
 let portfolio=null,limit=5,sectors={},summary=null,version=0,sectorState='loading',summaryState='loading',whyState='loading',whyNotes={},errors={};
 root.innerHTML=`<div class="portfolio-health-page"><nav aria-label="Home"><a href="/" aria-label="Lookout home"><img src="/Lookout_brand_logo-transparent.png" alt="Lookout" width="160" height="32"></a></nav><header class="ph-upload"><h1>See your portfolio’s health in one place</h1><p>See your holdings, gains, sectors, concentration, small positions and account charges from your Zerodha equity P&amp;L Excel.</p><button id="ph-upload-button" type="button">Upload your portfolio excel</button><input id="ph-file" type="file" aria-label="Upload your portfolio excel" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden><small class="ph-privacy">Your Excel stays in this browser. Only symbols and calculated facts are sent for analysis; your file and Client ID are never sent.</small><p id="ph-upload-status" role="status"></p></header><div id="ph-report" tabindex="-1" aria-live="polite"></div></div>`;
 const report=root.querySelector('#ph-report'),fileInput=root.querySelector('#ph-file'),note=root.querySelector('#ph-upload-status');
 const uploadButton=root.querySelector('#ph-upload-button');
 uploadButton.addEventListener('click',()=>fileInput.click());
 function paint(){if(!portfolio)return;report.innerHTML=renderPortfolioReport(portfolio,{limit,sectors,summary,sectorState,summaryState,whyState,whyNotes,errors});const input=report.querySelector('#ph-limit');input.addEventListener('change',()=>{const value=Number(input.value);if(!Number.isFinite(value)||value<0.1||value>100){input.setCustomValidity('Use a limit from 0.1 to 100.');input.reportValidity();return;}limit=value;paint();report.querySelector('#ph-limit').focus();});report.querySelector('#ph-sector-retry')?.addEventListener('click',()=>void loadSectors(version));}
 async function loadSectors(current){sectorState='loading';delete errors.sectors;paint();try{const response=await client.action(api.portfolioAI.sectors,{symbols:[...new Set(portfolio.entries.map(row=>row.symbol))]});if(current!==version)return;sectors=response;sectorState='ready';}catch(error){if(current!==version)return;errors.sectors=error instanceof Error?error.message:String(error);sectorState='error';}paint();}
 fileInput.addEventListener('change',async()=>{
  const file=fileInput.files?.[0];if(!file)return;const current=++version;fileInput.disabled=true;uploadButton.disabled=true;portfolio=null;report.innerHTML='<h1>Your portfolio health card</h1><p>Reading statement…</p>';note.textContent='Reading the statement in your browser…';
  try{const parsed=await readPortfolioFile(file);if(parsed.entries.length>1000)throw Error('Use a statement with at most 1,000 current positions.');portfolio=parsed;summary=null;sectors={};limit=5;summaryState='loading';sectorState='loading';whyState='loading';whyNotes={};errors={};note.textContent=parsed.entries.length?'Statement read. No file or Client ID was sent.':'No current positions with usable values were found. See broker review below.';paint();
   const facts=whyFacts(parsed);
   const batch=uploadNoteBatch(()=>client.action(api.portfolioAI.whyNotes,{facts}));
   void batch().then(response=>{if(current!==version)return;whyNotes=validateWhyNotes(response,facts);whyState='ready';paint();}).catch(error=>{if(current!==version)return;errors.why=error instanceof Error?error.message:String(error);whyState='error';paint();});
   void loadSectors(current);
   void client.action(api.portfolioAI.summary,{facts:portfolioFacts(parsed)}).then(line=>{if(current!==version)return;summary=line;summaryState='ready';paint();}).catch(error=>{if(current!==version)return;errors.summary=error instanceof Error?error.message:String(error);summaryState='error';paint();});
  }catch(error){report.innerHTML='<h1>Your portfolio health card</h1><p>Choose a valid statement to see portfolio facts.</p><footer>Facts from your broker statement. Not investment advice.</footer>';note.textContent=error instanceof Error&&/column|Symbol|Choose|positions|account sheet|delayed payment/.test(error.message)?error.message:'This file could not be read as a Zerodha equity P&L statement.';}
  finally{fileInput.value='';fileInput.disabled=false;uploadButton.disabled=false;}
 });
}
