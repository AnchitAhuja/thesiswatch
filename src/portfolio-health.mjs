import {ConvexHttpClient} from 'convex/browser';
import {api} from '../convex/_generated/api.js';
import {parsePortfolioSheets,portfolioFlags,portfolioFacts,factualSummaries,sectorTotals,unsafeCopy} from '../shared/portfolio-health.mjs';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=value=>value===null?'Not in statement':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(value);
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
export function renderPortfolioReport(portfolio,{limit=5,sectors={},summary=null,sectorState='ready',summaryState='ready'}={}){
 const largest=portfolio.entries[0],small=portfolio.entries.filter(row=>row.weight<0.5),smallValue=small.reduce((sum,row)=>sum+row.value,0);
 const facts=portfolioFacts(portfolio),fallback=factualSummaries(facts)[0];
 // Never render arbitrary generated copy. The model may choose only verified factual phrasings.
 const line=summary&&!unsafeCopy.test(summary)&&factualSummaries(facts).includes(summary)?summary:fallback;
 const flags=portfolioFlags(portfolio,limit);
 const metrics=[['Portfolio value',money(portfolio.total)],['Invested',money(portfolio.invested)],['Unrealised gain',`${money(portfolio.gain)} (${pct(portfolio.gainPct)})`],['Holdings count',String(portfolio.entries.length)],['Largest position',largest?`${largest.weight.toFixed(1)}% · ${largest.symbol}`:'No current positions']];
 return `<header class="ph-report-heading"><h1>Your portfolio health card</h1><p class="ph-summary">${esc(line)}</p>${summaryState==='loading'?'<p class="ph-muted" role="status">Writing the factual summary…</p>':summaryState==='error'?'<p class="ph-muted">The summary service is unavailable. The statement facts are shown above.</p>':''}</header>
 <div class="ph-metrics">${metrics.map(([label,value])=>`<article><h2>${label}</h2><p>${esc(value)}</p></article>`).join('')}</div>
 <section aria-labelledby="ph-worth"><div class="ph-section-heading"><h2 id="ph-worth">Worth a look</h2><label>Position limit (%) <input id="ph-limit" type="number" min="0.1" max="100" step="0.1" value="${limit}" inputmode="decimal"></label></div>
 <p class="ph-muted">Rows in broker review are excluded from portfolio totals.</p>
 <div class="ph-table-wrap" tabindex="0" aria-label="Portfolio flags"><table><thead><tr><th scope="col">Stock</th><th scope="col">Flag</th><th scope="col">Value</th><th scope="col">Return</th><th scope="col">Why</th></tr></thead><tbody>${flags.map(row=>`<tr><th scope="row">${esc(row.symbol)}</th><td>${esc(row.flag)}</td><td>${esc(money(row.value))}</td><td>${esc(pct(row.returnPct))}</td><td>${esc(row.why)}</td></tr>`).join('')||'<tr><td colspan="5">No positions meet these flag thresholds.</td></tr>'}</tbody></table></div></section>
 <section aria-labelledby="ph-money"><h2 id="ph-money">Where the money sits</h2><div class="ph-chart-grid"><article><h3>Top 12 holdings</h3><p class="ph-muted">Dashed line: ${limit}% limit</p>${bars(portfolio.entries.slice(0,12).map(row=>({name:row.symbol,weight:row.weight})),limit)}</article><article><h3>By sector</h3>${sectorState==='loading'?'<p role="status">Finding sectors from symbols…</p>':sectorState==='error'?'<p role="status">Sector lookup is unavailable. Try the sector lookup again.</p><button type="button" id="ph-sector-retry">Retry sector lookup</button>':bars(sectorTotals(portfolio,sectors))}<p class="ph-muted">Sector labels are AI classified; unknown symbols are Other.</p></article></div></section>
 <section aria-labelledby="ph-small"><h2 id="ph-small">Small positions</h2><p class="ph-small-total">${small.length} under 0.5% each</p><p>${esc(money(smallValue))} · ${(portfolio.total?smallValue/portfolio.total*100:0).toFixed(2)}% of portfolio</p></section>
 <section aria-labelledby="ph-account"><h2 id="ph-account">Account this year</h2><dl class="ph-account">${[['Realised P&L',portfolio.account.realised],['Trading charges',portfolio.account.charges],['Other debits',portfolio.account.other],['Delayed payment charges',portfolio.account.delayed]].map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(money(value))}</dd></div>`).join('')}</dl>${portfolio.account.delayed>0?'<p class="ph-charge-note">Delayed payment charges mean the trading balance went below zero.</p>':''}</section>
 <footer>Facts from your broker statement. Not investment advice.</footer>`;
}
export function bindPortfolioHealth(root,providedClient=null){
 document.body.classList.add('portfolio-health-body');
 const client=providedClient||new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL,{logger:false});
 let portfolio=null,limit=5,sectors={},summary=null,version=0,sectorState='loading',summaryState='loading';
 root.innerHTML=`<div class="portfolio-health-page"><nav><a href="/" aria-label="Lookout home"><img src="/Lookout_brand_logo-transparent.png" alt="Lookout" width="160" height="32"></a><a href="/">Back to home</a></nav><div class="ph-upload"><label for="ph-file">Your Zerodha equity P&L statement</label><p>Choose an .xlsx statement. The file stays in this browser tab. Client ID is not used or stored. Only symbols go to sector lookup; aggregate facts go to the summary.</p><input id="ph-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"><p id="ph-upload-status" role="status"></p></div><main id="ph-report"><h1>Your portfolio health card</h1><p>Choose a statement to see portfolio facts.</p><footer>Facts from your broker statement. Not investment advice.</footer></main></div>`;
 const report=root.querySelector('#ph-report'),fileInput=root.querySelector('#ph-file'),note=root.querySelector('#ph-upload-status');
 function paint(){if(!portfolio)return;report.innerHTML=renderPortfolioReport(portfolio,{limit,sectors,summary,sectorState,summaryState});const input=report.querySelector('#ph-limit');input.addEventListener('change',()=>{const value=Number(input.value);if(!Number.isFinite(value)||value<0.1||value>100){input.setCustomValidity('Use a limit from 0.1 to 100.');input.reportValidity();return;}limit=value;paint();report.querySelector('#ph-limit').focus();});report.querySelector('#ph-sector-retry')?.addEventListener('click',()=>void loadSectors(version));}
 async function loadSectors(current){sectorState='loading';paint();try{const response=await client.action(api.portfolioAI.sectors,{symbols:[...new Set(portfolio.entries.map(row=>row.symbol))]});if(current!==version)return;sectors=response;sectorState='ready';}catch{if(current!==version)return;sectorState='error';}paint();}
 fileInput.addEventListener('change',async()=>{
  const file=fileInput.files?.[0];if(!file)return;const current=++version;fileInput.disabled=true;portfolio=null;report.innerHTML='<h1>Your portfolio health card</h1><p>Reading statement…</p>';note.textContent='Reading the statement in your browser…';
  try{const parsed=await readPortfolioFile(file);if(parsed.entries.length>1000)throw Error('Use a statement with at most 1,000 current positions.');portfolio=parsed;summary=null;sectors={};limit=5;summaryState='loading';sectorState='loading';note.textContent=parsed.entries.length?'Statement read. No file or Client ID was sent.':'No current positions with usable values were found. See broker review below.';paint();
   void loadSectors(current);
   void client.action(api.portfolioAI.summary,{facts:portfolioFacts(parsed)}).then(line=>{if(current!==version)return;summary=line;summaryState='ready';paint();}).catch(()=>{if(current!==version)return;summaryState='error';paint();});
  }catch(error){report.innerHTML='<h1>Your portfolio health card</h1><p>Choose a valid statement to see portfolio facts.</p><footer>Facts from your broker statement. Not investment advice.</footer>';note.textContent=error instanceof Error&&/column|Symbol|Choose|positions|account sheet|delayed payment/.test(error.message)?error.message:'This file could not be read as a Zerodha equity P&L statement.';}
  finally{fileInput.value='';fileInput.disabled=false;}
 });
}
