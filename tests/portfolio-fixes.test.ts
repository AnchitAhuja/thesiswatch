// @vitest-environment jsdom
import {it,expect,vi,afterEach} from 'vitest';
import {readFile} from 'node:fs/promises';
import readExcelFile from 'read-excel-file/node';
import {parsePortfolioSheets} from '../shared/portfolio-health.mjs';
import {whyFacts,validWhySentence} from '../shared/portfolio-why.mjs';
import {renderPortfolioReport,money,moneyTotal} from '../src/portfolio-health.mjs';
import {convexTest} from 'convex-test';
import agentTest from '@convex-dev/agent/test';
import {Agent} from '@convex-dev/agent';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
const modules=import.meta.glob('../convex/**/*.ts');
const portfolio=async()=>parsePortfolioSheets(await readExcelFile(await readFile('tests/fixtures/sample-pnl.xlsx')));
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
it('keeps the provider response grammar constant for five and eighty symbols and notes',async()=>{
 vi.stubEnv('CONVEX_CLOUD_URL','https://fearless-ferret-257.convex.cloud');
 const t=convexTest(schema,modules);agentTest.register(t);
 const model=vi.spyOn(Agent.prototype,'generateObject');
 const grammars:{sectors:string[],whyNotes:string[]}={sectors:[],whyNotes:[]};
 for(const count of [5,80]){
  const symbols=Array.from({length:count},(_,i)=>`FAKE${count}X${i}`);
  model.mockResolvedValueOnce({object:{sectors:symbols.map(symbol=>({symbol,sector:'Other'}))}} as never);
  const map=await t.action(api.portfolioAI.sectors,{symbols});expect(Object.keys(map)).toHaveLength(count);
  grammars.sectors.push(JSON.stringify(model.mock.lastCall![2].schema.jsonSchema));
  const facts=Array.from({length:count},(_,i)=>({id:`p${i}`,value:1000.25+i,weight:1.3,returnPct:2.1,portfolioReturnPct:71.5,invested:800,gained:200+i,gainShare:1,portfolioGain:20000,multiple:1.3,rank:i+1,nextWeight:null,ratio:null,isinPresent:true,review:false}));
  const notes=facts.map(({id})=>({id,sentence:'Its original 800 rupees is now 1.3 times as large.'}));
  model.mockResolvedValueOnce({object:{notes}} as never);
  expect(Object.keys(await t.action(api.portfolioAI.whyNotes,{facts}))).toHaveLength(count);
  grammars.whyNotes.push(JSON.stringify(model.mock.lastCall![2].schema.jsonSchema));
  expect(JSON.parse(String(model.mock.lastCall![2].prompt))[0].value).toBe(1000);
 }
 expect(model).toHaveBeenCalledTimes(4);
 for(const schemas of Object.values(grammars)){expect(schemas[0]).toBe(schemas[1]);expect(schemas[0].length).toBeLessThan(900);}
});
it('rejects duplicate, missing and unknown response IDs before caching or displaying them',async()=>{
 vi.stubEnv('CONVEX_CLOUD_URL','https://fearless-ferret-257.convex.cloud');
 const t=convexTest(schema,modules);agentTest.register(t);const model=vi.spyOn(Agent.prototype,'generateObject');
 const facts=whyFacts(await portfolio()).slice(0,2);
 for(const ids of [['p0','p0'],['p0'],['p0','p99']]){
  model.mockResolvedValueOnce({object:{notes:ids.map(id=>({id,sentence:'At 54.0%, its return is 500.0%.'}))}} as never);
  await expect(t.action(api.portfolioAI.whyNotes,{facts})).rejects.toThrow('Factual notes');
 }
 for(const symbols of [['FAKEA','FAKEA'],['FAKEA'],['FAKEA','FAKEC']]){
  model.mockResolvedValueOnce({object:{sectors:symbols.map(symbol=>({symbol,sector:'Other'}))}} as never);
  await expect(t.action(api.portfolioAI.sectors,{symbols:['FAKEA','FAKEB']})).rejects.toThrow('Sector response');
 }
 // Failed classifications were not cached.
 model.mockResolvedValueOnce({object:{sectors:[{symbol:'FAKEA',sector:'ETF'},{symbol:'FAKEB',sector:'Other'}]}} as never);
 expect(await t.action(api.portfolioAI.sectors,{symbols:['FAKEA','FAKEB']})).toEqual({FAKEA:'ETF',FAKEB:'Other'});
});
it('shows escaped real AI errors only on DEV, including summary and note failures',async()=>{
 const p=await portfolio();const errors={why:'Provider note error <script>bad()</script>',sectors:'Provider sector error: grammar too large',summary:'Provider summary error'};
 for(const url of ['https://fearless-ferret-257.convex.cloud','https://first-yak-309.convex.cloud']){
  vi.stubEnv('VITE_CONVEX_URL',url);
  document.body.innerHTML=renderPortfolioReport(p,{whyState:'error',sectorState:'error',summaryState:'error',errors});
  const dev=url.includes('fearless');expect(document.querySelectorAll('.ph-ai-error')).toHaveLength(dev?3:0);
  expect(document.body.textContent!.includes('Provider sector error')).toBe(dev);expect(document.querySelector('script')).toBeNull();
  if(dev){expect(document.body.textContent).not.toContain('Factual note unavailable');expect(document.body.textContent).not.toContain('Sector lookup is unavailable');}
 }
});
it('groups flags once per symbol and puts small names only in a collapsed Small positions list',async()=>{
 const p=await portfolio();document.body.innerHTML=renderPortfolioReport(p);
 const symbols=[...document.querySelectorAll('tbody th')].map(cell=>cell.textContent);
 expect(new Set(symbols).size).toBe(symbols.length);expect(symbols).not.toContain('FAKEGAMMA');
 expect(document.querySelector('tbody')!.textContent).not.toContain('Under 0.5%');
 const details=document.querySelector('.ph-small-names') as HTMLDetailsElement;
 expect(details.open).toBe(false);expect(details.querySelector('li')!.textContent).toBe('FAKEGAMMA');
 expect(document.querySelectorAll('.ph-metric-value')).toHaveLength(5);
});
it('formats money without paise while leaving source calculations untouched',async()=>{
 const p=await portfolio();const before=JSON.stringify(p);
 expect(moneyTotal(1241000.49)).toBe('₹12.41L');expect(moneyTotal(12410000)).toBe('₹1.24Cr');expect(moneyTotal(-1241000)).toBe('-₹12.41L');
 expect(money(146520.49)).toBe('₹1,46,520');expect(money(146520.99)).toBe('₹1,46,521');expect(money(0)).toBe('₹0');
 renderPortfolioReport(p);expect(JSON.stringify(p)).toBe(before);
 const fact={...whyFacts(p)[0],invested:146520,value:200000.49};
 expect(validWhySentence('Its original investment is 146520 rupees.',fact)).toBe(true);
 expect(validWhySentence('Its original investment is 146520.49 rupees.',fact)).toBe(false);
});
