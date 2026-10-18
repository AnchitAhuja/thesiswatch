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
it('keeps small equities out of Worth a look',()=>{
 expect(portfolioFlags({entries:[{symbol:'FAKE',weight:0.449,value:10,invested:10,returnPct:0}],review:[]},5)).toEqual([]);
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
 const second=facts[1];expect(validWhySentence('Its original 10000 rupees lost 3000 rupees.',{...second,value:7000,gained:-3000})).toBe(true);
 expect(validWhySentence('Its original 10000 rupees is now 0.5 times as large.',second)).toBe(true);
 expect(validWhySentence('Largest at 45.0%, it is up 50.0%.',second)).toBe(false);
 expect(validWhySentence('At 45.0%, it is up 50.0% versus the portfolio return of 0.1%.',second)).toBe(false);
 expect(validWhySentence('At 45.0%, its return is −50.0% versus the portfolio return of 0.1%.',second)).toBe(false);
});
it('renders one grounded sentence per position and reuses it across multiple flags',async()=>{
 const p=await portfolio(),facts=whyFacts(p);
 const notes=Object.fromEntries(facts.map(row=>[row.id,row.review?'This row is excluded from portfolio totals because its statement details are incomplete.':row.gained===0?'Its investment has generated 0 rupees in gains.':`Its original ${row.invested} rupees is now ${row.multiple} times as large.`]));
 validateWhyNotes(notes,facts);document.body.innerHTML=renderPortfolioReport(p,{whyNotes:notes,whyState:'ready'});
 const why=[...document.querySelectorAll('tbody td:last-child')].map(cell=>cell.textContent!);
 expect(why).toHaveLength(4);expect(document.querySelector('tbody tr td')!.textContent).toBe('Above your 5% limit · Up more than 5x');expect([...document.querySelectorAll('tbody th')].map(cell=>cell.textContent)).toEqual(['FAKEALPHA','FAKEBETA','FAKEEPSILON','FAKEZETA']);
 for(const sentence of why){expect(sentence).not.toMatch(bannedWhy);expect(sentence.split(/\s+/).length).toBeLessThan(25);expect(sentence).toMatch(/\.$/);}
 document.body.innerHTML=renderPortfolioReport(p,{whyNotes:{...notes,p0:'You should sell this.'},whyState:'error'});
 expect(document.querySelector('tbody td:last-child')!.textContent).toBe('Factual note unavailable.');
 expect(document.querySelector('tbody')!.textContent).not.toMatch(bannedWhy);
});
it.each(['https://fearless-ferret-257.convex.cloud','https://first-yak-309.convex.cloud'])('batches and validates notes once per upload on %s',async url=>{
 vi.stubEnv('CONVEX_CLOUD_URL',url);const t=convexTest(schema,modules);agentTest.register(t);
 const facts=whyFacts(await portfolio());
 const notes=Object.fromEntries(facts.map(row=>[row.id,row.review?'This row is excluded from portfolio totals because its statement details are incomplete.':row.gained===0?'Its investment has generated 0 rupees in gains.':`Its original ${row.invested} rupees is now ${row.multiple} times as large.`]));
 const model=vi.spyOn(Agent.prototype,'generateObject').mockResolvedValue({object:{notes:Object.entries(notes).map(([id,sentence])=>({id,sentence}))}} as never);
 const load=vi.fn(()=>t.action(api.portfolioAI.whyNotes,{facts}));const batch=uploadNoteBatch(load);
 const [a,b]=await Promise.all([batch(),batch()]);expect(a).toEqual(notes);expect(b).toEqual(notes);await batch();
 expect(load).toHaveBeenCalledTimes(1);expect(model).toHaveBeenCalledTimes(1);
 const prompt=String(model.mock.calls[0][2].prompt);expect(JSON.parse(prompt).map(({allowedRupees,focus,...row})=>row)).toEqual(facts);expect(JSON.parse(prompt)[1].allowedRupees).toEqual([10000]);expect(JSON.parse(prompt)[1].focus).toContain('multiple');expect(prompt).not.toContain('FAKE-CLIENT');expect(prompt).not.toContain('FAKEALPHA');
 model.mockResolvedValue({object:{notes:Object.entries({...notes,p0:'You should buy more.'}).map(([id,sentence])=>({id,sentence}))}} as never);await expect(t.action(api.portfolioAI.whyNotes,{facts})).rejects.toThrow('Factual notes');
});

it('rejects a Why sentence that repeats the row Return value or current Value',async()=>{
 const facts=whyFacts(await portfolio());
 for(const row of facts.filter(row=>!row.review)){
  expect(validWhySentence(`Its return is ${row.returnPct.toFixed(1)}%.`,row)).toBe(false);expect(validWhySentence(`Its return is ${row.returnPct.toFixed(1)} percent.`,row)).toBe(false);
  expect(validWhySentence(`It is down ${Math.abs(row.returnPct).toFixed(1)}%.`,row)).toBe(false);
  expect(validWhySentence(`Its current value is ${Math.round(row.value)} rupees.`,row)).toBe(false);
 }
});

it('passes derived note facts without changing portfolio figures, including zero net gains',async()=>{
 const p=await portfolio(),before=JSON.stringify(p),facts=whyFacts(p);
 expect(facts[0]).toMatchObject({invested:1000,gained:5000,gainShare:50000,portfolioGain:10,multiple:6,rank:1,nextWeight:45,ratio:1.2});
 expect(facts[1]).toMatchObject({invested:10000,gained:-5000,gainShare:-50000,multiple:0.5,rank:2,nextWeight:1});
 expect(facts.find(row=>row.id==='r0')).toMatchObject({invested:null,gained:null,gainShare:null,multiple:null});
 expect(JSON.stringify(p)).toBe(before);
 expect(whyFacts({...p,gain:0}).every(row=>row.gainShare===null)).toBe(true);
 const fact=facts[0];
 expect(validWhySentence('Your biggest position is 1.2 times the next one, making its performance especially important to the portfolio.',fact)).toBe(true);
 expect(validWhySentence('Its original 1000 rupees gained 5000 rupees.',fact)).toBe(true);
 expect(validWhySentence('Its original 1000 rupees gained 9999 rupees.',fact)).toBe(false);
 expect(validWhySentence('Your biggest position is 1.2 times the next one, '+Array(20).fill('important').join(' ')+'.',fact)).toBe(false);
});
