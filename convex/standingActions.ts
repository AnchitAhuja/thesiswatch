"use node";
import {v,type Infer} from 'convex/values';
import {action,internalAction,type ActionCtx} from './_generated/server';
import type {Id} from './_generated/dataModel';
import {internal} from './_generated/api';
import {standingResult} from './standingFields';
import {researchEvidence,assessEvidence} from './evidenceEngine';
import {getStockById} from '../shared/stock-matching.mjs';
import {evidenceLogger,evidenceError,timedEvidence,type SourceReadDiagnostics} from './evidenceLogging';
import {withinWindow} from '../shared/standing.mjs';
async function perform(ctx:ActionCtx,args:{token?:string,id?:Id<'customTheses'>,bypassCache?:boolean}):Promise<Infer<typeof standingResult>> {
 const started=Date.now();
 const claim=await ctx.runMutation(internal.standing.claim,{token:args.token,id:args.id});
 const log=evidenceLogger(claim.stockId?getStockById(claim.stockId)?.name||claim.stockId:claim.thesis,claim.assumptions);
 log('Check started');
 if(claim.result){log('Standing result cache hit',{cacheKey:claim.key});for(const row of claim.result.assumptions)log('Final reason',{reason:row.assumption,status:row.status,sourcesKept:row.sources.map(s=>s.url)});log('Check complete',{ms:Date.now()-started});return claim.result;}
 const readDiagnostics:SourceReadDiagnostics=new Map();
 log('Standing result cache miss',{cacheKey:claim.key});
 try {
 const onProgress=claim.stockId?async(step:import('convex/values').Infer<typeof import('./holdingsFields').holdingProgressStep>)=>{log(step);await ctx.runMutation(internal.standing.progress,{id:claim.id,key:claim.key,step});}:undefined;
 const now=Date.now(),windowEnd=new Date(now).toISOString().slice(0,10),windowStart=new Date(now-30*86400000).toISOString().slice(0,10);
 let evidence,researchReused=false;
 if(claim.stockId){
  const stock=getStockById(claim.stockId);if(!stock)throw Error('Not supported yet');
  const cache=await timedEvidence(log,'Claim stockResearchCache',()=>ctx.runMutation(internal.stockResearch.claim,{stockId:stock.id,reasons:claim.assumptions,...(args.bypassCache?{bypassCache:true}:{})}));
  if(cache.evidence){evidence=cache.evidence;researchReused=true;}
  else {try {evidence=await researchEvidence(ctx,{thesis:stock.name,company:stock.name,assumptions:claim.assumptions,windowStart,windowEnd,onProgress,log,readDiagnostics});await ctx.runMutation(internal.stockResearch.finish,{stockId:stock.id,reasons:claim.assumptions,lease:cache.lease!,evidence});}catch(e){await ctx.runMutation(internal.stockResearch.finish,{stockId:stock.id,reasons:claim.assumptions,lease:cache.lease!});throw e;}}
  log('Filter cached evidence to current window',{sourcesFound:evidence.verified.length,dropped:evidence.verified.filter(s=>!withinWindow(s.date,windowStart,windowEnd)).map(s=>({url:s.url,why:'Publication date outside current window'}))});
  evidence={...evidence,verified:evidence.verified.filter(s=>withinWindow(s.date,windowStart,windowEnd)),windowStart,windowEnd};
 }else evidence=await researchEvidence(ctx,{thesis:claim.thesis,assumptions:claim.assumptions,windowStart,windowEnd,legacy:true,log});
 const result=await assessEvidence(ctx,{...evidence,thesis:claim.thesis,assumptions:claim.assumptions,researchReused,checkReasonMatch:!!claim.stockId,onProgress,log,readDiagnostics});
 await timedEvidence(log,'Save check result',()=>ctx.runMutation(internal.standing.finish,{id:claim.id,key:claim.key,result}));log('Check complete',{ms:Date.now()-started});return result;
 }catch(e){log('Check failed',{ms:Date.now()-started,error:evidenceError(e)});await ctx.runMutation(internal.standing.finish,{id:claim.id,key:claim.key});throw e;}
}
export const check=action({args:{token:v.string()},returns:standingResult,handler:perform});
export const checkSaved=internalAction({args:{id:v.id('customTheses'),bypassCache:v.optional(v.boolean())},returns:standingResult,handler:perform});
