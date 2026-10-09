import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import { renderStanding } from './standing.mjs';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function thesisMarkup(t) {
 const sources = new Map(t.source_references.map(s => [s.id,s]));
 const cite = ids => ids.map(id => {const s=sources.get(id);return `<a class="memo-citation" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.publisher)} · ${esc(s.date)}</a>`;}).join('');
 return `<header class="memo-header"><a class="memo-brand" href="/">LOOKOUT <span>By Vantage</span></a><a href="/?create=thesis">Build your own thesis</a></header><main class="thesis-memo">
 <header class="memo-intro"><h1>${esc(t.title)}</h1><p class="memo-take">${esc(t.take)}</p><p class="memo-muted">Prebuilt thesis · ${esc(t.investment_horizon)}<br>${esc(t.geography.join(' · '))} · ${esc(t.markets.join(' / '))}</p></header>
 <section class="memo-section"><h2>The idea: power is part of the infrastructure.</h2><p>${esc(t.summary)}</p><p>${esc(t.investment_case)}</p><ul class="memo-drivers">${t.structural_drivers.map(d=>`<li><p>${esc(d.text)}</p>${cite(d.source_ids)}</li>`).join('')}</ul></section>
 <section class="memo-section"><h2>Connected companies</h2><p class="memo-muted">Research candidates, grouped by their connection to the idea. No allocation is implied.</p>${t.stock_buckets.map(b=>`<div class="memo-bucket"><h3>${esc(b.title)}</h3><p class="memo-muted">${esc(b.description)}</p><div class="memo-companies">${b.company_ids.map(id=>{const c=t.candidate_companies.find(c=>c.id===id);return `<article class="memo-company"><div class="memo-company-title"><h4>${esc(c.name)}</h4><span>${esc(c.exchange)}: ${esc(c.ticker)}</span></div><p class="memo-role">${esc(c.role)} · ${esc(c.exposure)} exposure</p><p>${esc(c.evidence)}</p>${cite(c.source_ids)}<details><summary>Company context</summary><p>${esc(c.company_risk)}</p>${c.financial_indicators.map(m=>`<p>${esc(m.name)}: ${esc(m.value)} · ${esc(m.period)}</p>`).join('')}<p>Source confidence: ${esc(c.confidence)}. ${esc(c.confidence_reason)}</p></details></article>`;}).join('')}</div></div>`).join('')}</section>
 <section class="memo-section"><h2>Assumptions: three things that need to stay true.</h2><ol class="memo-assumptions">${t.assumptions.map((a,i)=>`<li><h3>${esc(a)}</h3><p class="memo-muted">Watch: ${esc(t.monitoring_indicators.find(m=>m.assumption_index===i).indicator)}</p></li>`).join('')}</ol></section>
 <section class="memo-section"><h2>Risks: where the idea could struggle.</h2><ul>${t.risks.map(r=>`<li>${esc(r)}</li>`).join('')}</ul><h3>The opposing case</h3><ul>${t.counterarguments.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></section>
 <section class="memo-section"><h2>What would break it</h2><ol>${t.invalidation_conditions.map(r=>`<li>${esc(r)}</li>`).join('')}</ol></section>
 <section class="memo-check"><h2>Is the thesis still supported?</h2><p class="memo-muted">${esc(t.status_explanation)}</p><button class="memo-check-button" type="button">See where this thesis stands: last 30 days</button><p class="memo-check-note" role="status" aria-live="polite"></p><div class="memo-standing"></div></section>
 <section class="memo-section memo-sources"><h2>Sources behind this page</h2><p class="memo-muted">Background research, verified ${esc(t.last_verified_at)}. These disclosures can be older than 30 days; recent evidence is checked separately above.</p><ol>${t.source_references.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><p>${esc(s.publisher)} · ${esc(s.date)}<br>${esc(s.reporting_period)}</p></li>`).join('')}</ol><details><summary>Research limits</summary><ul>${t.data_quality_flags.map(f=>`<li>${esc(f)}</li>`).join('')}</ul></details></section><footer class="memo-footer"><a href="/">Back to Lookout</a></footer></main>`;
}
export async function bindPrebuiltThesis(app) {
 document.body.classList.add('lookout-dark','prebuilt-page');
 app.innerHTML='<main class="thesis-memo"><p role="status">Loading AI Infrastructure…</p></main>';
 try {
  const convex = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);
  const t = await convex.query(api.prebuilt.read,{thesis_id:'ai-infrastructure'});
  app.innerHTML=thesisMarkup(t);
  const button=app.querySelector('.memo-check-button'),note=app.querySelector('.memo-check-note');
  button.onclick=async()=>{
   button.disabled=true;note.textContent='Checking the last 30 days. This can take a minute…';
   try {
    let token;try {token=localStorage.getItem('lookout-ai-infrastructure-token');}catch{}
    if(!/^[a-f0-9]{64}$/.test(token||'')){token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');try{localStorage.setItem('lookout-ai-infrastructure-token',token);}catch{}}
    const checked=await convex.action(api.prebuiltActions.check,{thesis_id:t.thesis_id,token});
    renderStanding(app.querySelector('.memo-standing'),checked.result,email=>convex.mutation(api.standing.subscribe,{token:checked.token,email}));
    note.textContent='Check complete. The result is reused for 24 hours.';
   }catch(error){note.textContent=error.message || 'Could not check the thesis. Try again.';}finally{button.disabled=false;}
  };
 }catch {app.innerHTML='<main class="thesis-memo"><h1>AI Infrastructure</h1><p role="alert">Could not load the thesis. Please refresh to try again.</p><a href="/">Back to Lookout</a></main>';}
}
