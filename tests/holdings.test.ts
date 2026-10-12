import {it,expect,vi} from 'vitest';
import {convexTest} from 'convex-test';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
import {matchStock,validateExtracted,stockTakeaway} from '../shared/stock-matching.mjs';
const modules=import.meta.glob('../convex/**/*.ts');
it('matches exact exchange names and tickers without guessing funds or fuzzy names',()=>{
 expect(matchStock('Bajaj Auto')?.id).toBe('IN:BAJAJ-AUTO');expect(matchStock('Eternal')?.id).toBe('IN:ETERNAL');expect(matchStock('NVDA')?.market).toBe('US');
 expect(matchStock('Bajaj')).toBeNull();expect(matchStock('Unknown growth company')).toBeNull();expect(matchStock('Nifty 500 fund')).toBeNull();
 expect(()=>validateExtracted({items:[{stock:'Eternal',reasons:['Orders rise']}]},'Eternal, order growth')).toThrow();
 expect(validateExtracted({items:[{stock:'Eternal',reasons:['order growth']}]},'Eternal, order growth')[0].reasons).toEqual(['order growth']);
});
it('isolates private sessions, saves edits and removals, flags unsupported names and preserves exact reasons',async()=>{
 const t=convexTest(schema,modules),token='a'.repeat(64);
 await t.mutation(internal.holdings.create,{token,original:'Stocks',items:[{stock:'Bajaj Auto',reasons:['Original']},{stock:'Eternal',reasons:['Removed']}]});
 expect(await t.query(api.holdings.read,{token:'b'.repeat(64)})).toBeNull();
 await t.mutation(api.holdings.confirm,{token,items:[{stock:'Bajaj Auto',reasons:['strong EV promise']},{stock:'Mystery mutual fund',reasons:['growth']}]});
 const view=await t.query(api.holdings.read,{token});expect(view?.lines).toHaveLength(2);expect(view?.lines[1].error).toBe('Not supported yet');expect(view?.lines[0]).not.toHaveProperty('privateToken');
 const session=await t.query(internal.holdings.get,{token}),line=session!.lines[0];
 const claim=await t.mutation(internal.standing.claim,{id:line.thesisId!});expect(claim.assumptions).toEqual(['strong EV promise']);expect(claim.stockId).toBe('IN:BAJAJ-AUTO');
 await t.mutation(internal.standing.finish,{id:line.thesisId!,key:claim.key});
 await t.mutation(api.standing.subscribe,{token:line.privateToken!,email:' Person@Example.com '});
 const saved=await t.run(ctx=>ctx.db.get(line.thesisId!));expect(saved?.standingActive).toBe(true);expect(saved?.standingEmail).toBe('person@example.com');expect(saved?.interpretation?.inferredAssumptions).toEqual(['strong EV promise']);
 await t.mutation(internal.holdings.recordError,{id:session!.id,index:0,error:'Check stopped: daily spending limit reached.'});expect((await t.query(api.holdings.read,{token}))?.lines[0].result).toBeNull();
});
it('shares stock research for seven days, prevents concurrent duplicate searches, renews stale research',async()=>{
 vi.stubEnv('CONVEX_CLOUD_URL','https://fearless-ferret-257.convex.cloud');
 const t=convexTest(schema,modules),stockId='IN:BAJAJ-AUTO',reasons=['EV promise'];
 const first=await t.mutation(internal.stockResearch.claim,{stockId,reasons});await expect(t.mutation(internal.stockResearch.claim,{stockId,reasons})).rejects.toThrow('already running');
 const evidence={verified:[],searchAudit:[],searches:8,windowStart:'2026-09-10',windowEnd:'2026-10-10',researchedAt:Date.now()};
 await t.mutation(internal.stockResearch.finish,{stockId,reasons,lease:first.lease!,evidence});expect((await t.mutation(internal.stockResearch.claim,{stockId,reasons})).evidence).toEqual(evidence);expect((await t.mutation(internal.stockResearch.claim,{stockId,reasons:['different reason']})).evidence).toEqual(evidence);
 vi.spyOn(Date,'now').mockReturnValue(evidence.researchedAt+7*86400000+1);try{expect((await t.mutation(internal.stockResearch.claim,{stockId,reasons})).evidence).toBeNull();}finally{vi.restoreAllMocks();vi.unstubAllEnvs();}
});
it('derives a mixed top line from actual assessed statuses and keeps no evidence separate',()=>{
 expect(stockTakeaway([{status:'WEAKENING'},{status:'STRENGTHENING'}])).toBe('Mixed: reason 1 weakened; reason 2 strengthened.');
 expect(stockTakeaway([{status:'No new evidence'}])).toBe('No new evidence for your reasons.');
});

it('saves real stock steps privately and ignores progress after completion',async()=>{
 const t=convexTest(schema,modules),token='e'.repeat(64),items=[{stock:'ITC',reasons:['exact original reason']}];
 await t.mutation(internal.holdings.create,{token,original:'ITC',items});await t.mutation(api.holdings.confirm,{token,items});
 const session=await t.query(internal.holdings.get,{token}),id=session!.lines[0].thesisId!;
 const claim=await t.mutation(internal.standing.claim,{id});
 await t.mutation(internal.standing.progress,{id,key:'wrong',step:'Searching recent news'});
 expect((await t.query(api.holdings.read,{token}))?.lines[0].progress).toBeUndefined();
 await t.mutation(internal.standing.progress,{id,key:claim.key,step:'Checking your reason against evidence'});
 expect((await t.query(api.holdings.read,{token}))?.lines[0].progress?.step).toBe('Checking your reason against evidence');
 expect(await t.query(api.holdings.read,{token:'f'.repeat(64)})).toBeNull();
 await t.mutation(internal.standing.finish,{id,key:claim.key});
 await t.mutation(internal.standing.progress,{id,key:claim.key,step:'Searching recent news'});
 expect((await t.query(api.holdings.read,{token}))?.lines[0].progress?.step).toBe('Stopped');
});

it('clears only the requested company research on dev',async()=>{
 vi.stubEnv('CONVEX_CLOUD_URL','https://fearless-ferret-257.convex.cloud');
 try{const t=convexTest(schema,modules);
 await t.run(async ctx=>{await ctx.db.insert('stockResearchCache',{key:'old-company-policy',stockId:'IN:DELHIVERY'});await ctx.db.insert('stockResearchCache',{key:'other-company',stockId:'IN:ITC'});});
 expect(await t.mutation(internal.stockResearch.clearForDev,{stockId:'IN:DELHIVERY'})).toBe(1);
 expect(await t.run(ctx=>ctx.db.query('stockResearchCache').withIndex('by_stock_id',q=>q.eq('stockId','IN:DELHIVERY')).take(10))).toEqual([]);
 expect((await t.run(ctx=>ctx.db.query('stockResearchCache').withIndex('by_stock_id',q=>q.eq('stockId','IN:ITC')).take(10)))).toHaveLength(1);
 }finally{vi.unstubAllEnvs();}
});
