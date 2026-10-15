// @vitest-environment jsdom
import {it,expect,vi,afterEach} from 'vitest';
import readExcelFile from 'read-excel-file/node';
import {readFile} from 'node:fs/promises';
import {parsePortfolioSheets,portfolioFlags,portfolioFacts} from '../shared/portfolio-health.mjs';
import {whyFacts,validWhySentence,validateWhyNotes,uploadNoteBatch,bannedWhy} from '../shared/portfolio-why.mjs';
import {renderPortfolioReport} from '../src/portfolio-health.mjs';
import {convexTest} from 'convex-test';
import agentTest from '@convex-dev/agent/test';
import {Agent} from '@convex-dev/agent';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
const modules=import.meta.glob('../convex/**/*.ts');
const portfolio=async()=>parsePortfolioSheets(await readExcelFile(await readFile('tests/fixtures/sample-pnl.xlsx')));
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
it('exempts every BEES symbol and classified ETFs from only the small-position flag',()=>{
 for(const symbol of ['GOLDBEES','NIFTYBEES','JUNIORBEES','LIQUIDBEES','CUSTOMBEES','custombees','OTHERETF']){
  const p={entries:[{symbol,value:10,invested:100,weight:0.1,returnPct:-90}],review:[]};
  const flags=portfolioFlags(p,5,{OTHERETF:'ETF'});
  expect(flags.some(row=>row.flag==='Under 0.5% of portfolio')).toBe(false);
  expect(flags.some(row=>row.flag==='Down more than 40%')).toBe(true);
  expect(portfolioFacts(p).smallCount).toBe(1);
 }
});
it.each([0.45,0.49,0.49999,0.5,0.51])('never flags raw weight %s when displayed as 0.5%',weight=>{
 const p={entries:[{symbol:'FAKE',weight,value:10,invested:10,returnPct:0}],review:[]};
 expect(portfolioFlags(p,5).some(row=>row.flag==='Under 0.5% of portfolio')).toBe(false);
});
it('still flags an eligible equity displayed below 0.5%',()=>{
 expect(portfolioFlags({entries:[{symbol:'FAKE',weight:0.449,value:10,invested:10,returnPct:0}],review:[]},5)[0].flag).toBe('Under 0.5% of portfolio');
});
it('fails if any Why sentence contains a banned word, made-up figure, duration, or extra sentence',async()=>{
 const facts=whyFacts(await portfolio());const fact=facts[0];
 for(const word of ['buy','SELL','trim','exit','hold','add','book','clean up','should','consider']){
  expect(()=>validateWhyNotes({[fact.id]:`At 54.0%, ${word} this position.`},[fact])).toThrow('Factual notes');
 }
 expect(validWhySentence('At 99.9%, this is the largest position.',fact)).toBe(false);
 expect(validWhySentence('At 54.0%, it has been flat for months.',fact)).toBe(false);
 expect(validWhySentence('The largest position delivered a 500.0% return and currently holds 54.0% weight, targeted to decrease to 45.0% with a 1.2 ratio to the next largest holding.',fact)).toBe(false);
 expect(validWhySentence('Rebalance this 54.0% position.',fact)).toBe(false);
 expect(validWhySentence('At 54.0%, it is largest. Another sentence.',fact)).toBe(false);
 expect(validWhySentence('At 54.0%, '+Array(29).fill('position').join(' ')+'.',fact)).toBe(false);
 const second=facts[1];
 expect(validWhySentence('Second-largest at 45.0%, it is down 50.0% versus the portfolio return of 0.1%.',second)).toBe(true);
 expect(validWhySentence('Largest at 45.0%, it is up 50.0%.',second)).toBe(false);
 expect(validWhySentence('At 45.0%, it is up 50.0% versus the portfolio return of 0.1%.',second)).toBe(false);
 expect(validWhySentence('At 45.0%, its return is −50.0% versus the portfolio return of 0.1%.',second)).toBe(true);
});
it('renders one grounded sentence per position and reuses it across multiple flags',async()=>{
 const p=await portfolio(),facts=whyFacts(p);
 const notes=Object.fromEntries(facts.map(row=>[row.id,row.review?`Its statement value is ${row.value.toFixed(2)} rupees, with this row excluded from portfolio totals.`:`At ${row.weight.toFixed(1)}%, its return is ${row.returnPct.toFixed(1)}% versus the portfolio's ${row.portfolioReturnPct.toFixed(1)}%.`]));
 validateWhyNotes(notes,facts);document.body.innerHTML=renderPortfolioReport(p,{whyNotes:notes,whyState:'ready'});
 const why=[...document.querySelectorAll('tbody td:last-child')].map(cell=>cell.textContent!);
 expect(why.length).toBeGreaterThan(facts.length);expect(why[0]).toBe(why[1]);
 for(const sentence of why){expect(sentence).not.toMatch(bannedWhy);expect(sentence.split(/\s+/).length).toBeLessThan(30);expect(sentence).toMatch(/\.$/);}
 document.body.innerHTML=renderPortfolioReport(p,{whyNotes:{...notes,p0:'You should sell this.'},whyState:'error'});
 expect(document.querySelector('tbody td:last-child')!.textContent).toBe('Factual note unavailable.');
 expect(document.querySelector('tbody')!.textContent).not.toMatch(bannedWhy);
});
it('batches notes into one DEV AI call and caches the promise for the lifetime of an upload',async()=>{
 vi.stubEnv('CONVEX_CLOUD_URL','https://fearless-ferret-257.convex.cloud');const t=convexTest(schema,modules);agentTest.register(t);
 const facts=whyFacts(await portfolio());
 const notes=Object.fromEntries(facts.map(row=>[row.id,row.review?`Its statement value is ${row.value.toFixed(2)} rupees, with this row excluded from portfolio totals.`:`At ${row.weight.toFixed(1)}%, its return is ${row.returnPct.toFixed(1)}% versus the portfolio's ${row.portfolioReturnPct.toFixed(1)}%.`]));
 const model=vi.spyOn(Agent.prototype,'generateObject').mockResolvedValue({object:notes} as never);
 const load=vi.fn(()=>t.action(api.portfolioAI.whyNotes,{facts}));const batch=uploadNoteBatch(load);
 const [a,b]=await Promise.all([batch(),batch()]);expect(a).toEqual(notes);expect(b).toEqual(notes);await batch();
 expect(load).toHaveBeenCalledTimes(1);expect(model).toHaveBeenCalledTimes(1);
 const prompt=String(model.mock.calls[0][2].prompt);expect(JSON.parse(prompt)).toEqual(facts);expect(prompt).not.toContain('FAKE-CLIENT');expect(prompt).not.toContain('FAKEALPHA');
 model.mockResolvedValue({object:{...notes,p0:'You should buy more.'}} as never);await expect(t.action(api.portfolioAI.whyNotes,{facts})).rejects.toThrow('Factual notes');
 vi.stubEnv('CONVEX_CLOUD_URL','https://first-yak-309.convex.cloud');await expect(t.action(api.portfolioAI.whyNotes,{facts})).rejects.toThrow('DEV only');
});
