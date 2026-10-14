import {afterEach,it,expect,vi} from 'vitest';
import {convexTest} from 'convex-test';
import agentTest from '@convex-dev/agent/test';
import {Agent} from '@convex-dev/agent';
import schema from '../convex/schema';
const modules=import.meta.glob('../convex/**/*.ts');
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();vi.resetModules();});
async function setup(){
 vi.stubEnv('CONVEX_CLOUD_URL','https://fearless-ferret-257.convex.cloud');
 const {researchEvidence}=await import('../convex/evidenceEngine');
 const t=convexTest(schema,modules);agentTest.register(t);
 return {t,researchEvidence};
}
function searchResult(prompt:string,output:any[]=[]){
 const query=JSON.parse(prompt.match(/query exactly ("[^"\n]+")/)![1]);
 return {steps:[{toolCalls:[{toolCallId:query,toolName:'web_search',input:{query}}],toolResults:[{toolCallId:query,toolName:'web_search',output}]}]};
}
it('starts all four DEV searches before any finish and uses independent threads',async()=>{
 const {t,researchEvidence}=await setup();
 const threads:string[]=[],pending:(()=>void)[]=[];
 vi.spyOn(Agent.prototype,'generateText').mockImplementation(async(_ctx,thread,options)=>{
  threads.push(thread.threadId!);
  await new Promise<void>(resolve=>{pending.push(resolve);if(pending.length===4)pending.forEach(release=>release());});
  return searchResult(options.prompt as string) as never;
 });
 const result=await t.action(ctx=>researchEvidence(ctx,{thesis:'NVIDIA Corporation',company:'NVIDIA Corporation',assumptions:['AI data center demand will keep growing'],windowStart:'2026-09-14',windowEnd:'2026-10-14'}));
 expect(threads).toHaveLength(4);expect(new Set(threads).size).toBe(4);expect(result.searches).toBe(4);expect(result.modelCalls).toBe(4);
},5000);
it('sends SEC identification and keeps a loaded article using its search date',async()=>{
 const {t,researchEvidence}=await setup();
 const url='https://www.sec.gov/Archives/edgar/data/1045810/example.htm';
 vi.spyOn(Agent.prototype,'generateText').mockImplementation(async(_ctx,_thread,options)=>searchResult(options.prompt as string,[{type:'web_search_result',url,title:'NVIDIA Corporation demand',pageAge:'2026-10-10'}]) as never);
 const fetcher=vi.fn(async()=>new Response('<article><p>NVIDIA Corporation reports growing data center demand with measured growth in revenue.</p></article>',{headers:{'content-type':'text/html'}}));
 vi.stubGlobal('fetch',fetcher);
 const events:any[]=[];
 const result=await t.action(ctx=>researchEvidence(ctx,{thesis:'NVIDIA Corporation',company:'NVIDIA Corporation',assumptions:['AI data center demand will keep growing'],windowStart:'2026-09-14',windowEnd:'2026-10-14',log:(step,details)=>events.push({step,...details})}));
 expect(fetcher).toHaveBeenCalledWith(url,expect.objectContaining({headers:{'User-Agent':'Lookout anchitgh71@gmail.com'}}));
 expect(result.verified).toHaveLength(1);expect(result.verified[0].date).toBe('2026-10-10');
 expect(events.find(event=>event.step==='Source filtering')).toMatchObject({kept:true,dateSource:'Search result publication date'});
});

it('logs the kept passages and exact status gate without changing the result',async()=>{
 const {t}=await setup();const {assessEvidence}=await import('../convex/evidenceEngine');
 const source={url:'https://publisher.com/news',title:'Delhivery Ltd. costs',publisher:'publisher.com',date:'2026-10-10',excerpt:'Delhivery Ltd. has expanded its delivery network across several cities.'};
 vi.spyOn(Agent.prototype,'generateObject')
  .mockResolvedValueOnce({object:{articles:[{sourceUrl:source.url,reasonIndices:[0],paragraphIndices:[0]}]}} as never)
  .mockResolvedValueOnce({object:{takeaway:'Evidence is related.',assumptions:[{status:'INTACT',signalStrength:'soft',reason:'Network expanded.',sourceUrls:[source.url],brokerageEvidence:[]}]}} as never)
  .mockResolvedValueOnce({object:{reviews:[{match:'indirect',explanation:'Network expansion does not establish technology reducing costs.',quotes:[]}]}} as never);
 const events:any[]=[];
 const result=await t.action(ctx=>assessEvidence(ctx,{thesis:'Delhivery Ltd.',assumptions:['Its technology helps reduce delivery costs'],verified:[source],searchAudit:[],searches:4,windowStart:'2026-09-14',windowEnd:'2026-10-14',checkReasonMatch:true,readDiagnostics:new Map([[source.url,{ms:123,characters:source.excerpt.length}]]),log:(step,details)=>events.push({step,...details})}));
 expect(result.assumptions[0]).toMatchObject({status:'No new evidence',reason:'no clear evidence in the last 30 days',sources:[]});
 expect(events.find(event=>event.step==='Kept source details')).toMatchObject({url:source.url,readMs:123,characters:source.excerpt.length,paragraphsMatched:['Delhivery Ltd.']});
 expect(events.find(event=>event.step==='Assessment model input')).toMatchObject({sourcesSent:1,paragraphsSent:1});
 expect(events.find(event=>event.step==='Source verdict')).toMatchObject({rawPerSourceVerdict:null,rawReasonVerdict:{status:'INTACT'}});
 expect(events.some(event=>event.step==='Final status rule'&&event.match==='indirect'&&event.ruleApplied&&event.after==='No new evidence')).toBe(true);
 expect(Agent.prototype.generateObject).toHaveBeenCalledTimes(3);
});
