// @vitest-environment jsdom
import {it,expect,vi,afterEach} from 'vitest';
import {readFile} from 'node:fs/promises';
import readExcelFile from 'read-excel-file/node';
import {parsePortfolioSheets,portfolioFlags,portfolioFacts,factualSummaries,sectorTotals,amount,SECTORS} from '../shared/portfolio-health.mjs';
import {renderPortfolioReport,bindPortfolioHealth} from '../src/portfolio-health.mjs';
import {convexTest} from 'convex-test';
import agentTest from '@convex-dev/agent/test';
import {Agent} from '@convex-dev/agent';
import schema from '../convex/schema';
import {api} from '../convex/_generated/api';
const modules=import.meta.glob('../convex/**/*.ts');
const fixture=()=>readFile('tests/fixtures/sample-pnl.xlsx');
const sheets=async()=>readExcelFile(await fixture());
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
it('reads the actual fake .xlsx, locates the lower header, and excludes broker-review rows',async()=>{
 const raw=await sheets();expect(raw).toHaveLength(2);expect(raw[0].data[9][0]).toBe('Symbol');expect(raw[0].data.slice(10)).toHaveLength(6);
 const p=parsePortfolioSheets(raw);expect(p.entries).toHaveLength(4);expect(p.review.map(r=>r.symbol)).toEqual(['FAKEEPSILON','FAKEZETA']);
 expect(p.total).toBe(11120);expect(p.invested).toBe(11110);expect(p.gain).toBe(10);expect(p.gainPct).toBeCloseTo(10/11110*100);
 expect(p.entries.reduce((sum,row)=>sum+row.weight,0)).toBeCloseTo(100);
 expect(p.account).toEqual({realised:250,charges:75,other:-25,delayed:30});
 expect(JSON.stringify(p)).not.toContain('FAKE-CLIENT-NEVER-SEND');expect(JSON.stringify(p)).not.toMatch(/client.?id/i);
});
it('uses open quantity, aggregates duplicate ISINs, and handles zero, absent and Indian-formatted values',async()=>{
 const raw=await sheets();raw[0].data.push(['CLOSED','FAKEISIN9999',9,10,9,0,0,0,0,'Long',10,9,0]);
 raw[0].data.push([...raw[0].data[10]]);const p=parsePortfolioSheets(raw);
 expect(p.entries).toHaveLength(4);expect(p.entries[0].quantity).toBe(20);expect(p.entries[0].value).toBe(12000);
 expect(amount('₹ 1,23,456.75')).toBe(123456.75);expect(amount('(125.50)')).toBe(-125.5);expect(Number.isNaN(amount(null))).toBe(true);
 expect(()=>parsePortfolioSheets([{data:[['not a statement']]}])).toThrow('Symbol');
});
it('keeps factual flag thresholds strict and updates the position limit',async()=>{
 const p=parsePortfolioSheets(await sheets());const flags=portfolioFlags(p,5);
 expect(flags.filter(r=>r.flag==='Above your 5% limit')).toHaveLength(2);
 expect(flags.some(r=>r.symbol==='FAKEALPHA'&&r.flag==='Up more than 5x')).toBe(true);
 expect(flags.some(r=>r.symbol==='FAKEBETA'&&r.flag==='Down more than 40%')).toBe(true);
 expect(flags.some(r=>r.symbol==='FAKEGAMMA'&&r.flag==='Under 0.5% of portfolio')).toBe(true);
 expect(flags.filter(r=>r.flag==='Check with your broker')).toHaveLength(2);
 expect(portfolioFlags(p,60).some(r=>r.flag.startsWith('Above'))).toBe(false);
 const boundary={entries:[{symbol:'BOUNDARY',weight:0.5,value:500,invested:100,returnPct:-40}],review:[]};
 expect(portfolioFlags(boundary,0.5)).toEqual([]);
});
it('renders every required section in order and contains none of the forbidden whole words',async()=>{
 const p=parsePortfolioSheets(await sheets());document.body.innerHTML=renderPortfolioReport(p,{sectors:{FAKEALPHA:'ETF',FAKEBETA:'Financial Services'}});
 const text=document.body.textContent!;expect(text).not.toMatch(/\b(buy|sell|trim|exit|hold)\b/i);
 const headings=['Your portfolio health card','Portfolio value','Invested','Unrealised gain','Holdings count','Largest position','Worth a look','Where the money sits','Small positions','Account this year'];
 let cursor=-1;for(const heading of headings){const next=text.indexOf(heading,cursor+1);expect(next).toBeGreaterThan(cursor);cursor=next;}
 expect([...document.querySelectorAll('thead th')].map(el=>el.textContent)).toEqual(['Stock','Flag','Value','Return','Why']);
 expect(text).not.toContain('Action');expect(text).toContain('Delayed payment charges mean the trading balance went below zero.');expect(text).toContain('Facts from your broker statement. Not investment advice.');
 expect(document.querySelector('.ph-limit-line')).not.toBeNull();expect(document.querySelector('#ph-limit')?.getAttribute('value')).toBe('5');
 document.body.innerHTML=renderPortfolioReport(p,{summary:'Buy everything and trim the rest.'});expect(document.body.textContent).not.toMatch(/\b(buy|sell|trim|exit|hold)\b/i);
 const totals=sectorTotals(p,{FAKEALPHA:'ETF',FAKEBETA:'Financial Services'});expect(totals.reduce((sum,r)=>sum+r.value,0)).toBe(p.total);expect(SECTORS).toHaveLength(15);
});
it('has safe upload and AI error states without sending any file or client data on page entry',async()=>{
 const client={action:vi.fn()};document.body.innerHTML='<div id="app"></div>';bindPortfolioHealth(document.querySelector('#app'),client);
 expect(client.action).not.toHaveBeenCalled();expect(document.querySelector('input[type=file]')?.getAttribute('accept')).toContain('.xlsx');
 expect(document.body.textContent).not.toMatch(/\b(buy|sell|trim|exit|hold)\b/i);
 const p=parsePortfolioSheets(await sheets());p.account.delayed=0;
 document.body.innerHTML=renderPortfolioReport(p,{sectorState:'error',summaryState:'error'});
 expect(document.querySelector('#ph-sector-retry')?.textContent).toBe('Retry sector lookup');
 expect(document.body.textContent).not.toContain('Delayed payment charges mean');
 expect(document.body.textContent).not.toMatch(/\b(buy|sell|trim|exit|hold)\b/i);
});
it('classifies symbols in one AI call, caches sectors, and validates the fact-only summary',async()=>{
 vi.stubEnv('CONVEX_CLOUD_URL','https://fearless-ferret-257.convex.cloud');const t=convexTest(schema,modules);agentTest.register(t);
 const model=vi.spyOn(Agent.prototype,'generateObject').mockResolvedValueOnce({object:{FAKEALPHA:'Other',FAKEBETA:'ETF'}} as never);
 expect(await t.action(api.portfolioAI.sectors,{symbols:['FAKEALPHA','FAKEBETA']})).toEqual({FAKEALPHA:'Other',FAKEBETA:'ETF'});
 expect(await t.action(api.portfolioAI.sectors,{symbols:['FAKEBETA','FAKEALPHA']})).toEqual({FAKEBETA:'ETF',FAKEALPHA:'Other'});expect(model).toHaveBeenCalledTimes(1);
 expect(model.mock.calls[0][2].prompt).toBe('["FAKEALPHA","FAKEBETA"]');
 expect(model.mock.calls[0][1]).toEqual({userId:'portfolio-sector-service'});
 const facts=portfolioFacts(parsePortfolioSheets(await sheets()));model.mockResolvedValueOnce({object:{summary:factualSummaries(facts)[0]}} as never);
 expect(await t.action(api.portfolioAI.summary,{facts})).toBe(factualSummaries(facts)[0]);
 model.mockResolvedValueOnce({object:{summary:'Buy now.'}} as never);await expect(t.action(api.portfolioAI.summary,{facts})).rejects.toThrow('Summary could not be verified');
 model.mockResolvedValueOnce({object:{FAKEGAMMA:'Invented sector'}} as never);await expect(t.action(api.portfolioAI.sectors,{symbols:['FAKEGAMMA']})).rejects.toThrow('Sector response');
 vi.stubEnv('CONVEX_CLOUD_URL','https://first-yak-309.convex.cloud');await expect(t.action(api.portfolioAI.sectors,{symbols:['FAKEALPHA']})).rejects.toThrow('DEV only');
});
