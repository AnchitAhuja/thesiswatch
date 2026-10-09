"use node";
import {v,type Infer} from 'convex/values';
import {action,internalAction,type ActionCtx} from './_generated/server';
import type {Id} from './_generated/dataModel';
import {internal} from './_generated/api';
import {standingResult} from './standingFields';
import {researchEvidence,assessEvidence} from './evidenceEngine';
import {getStockById} from '../shared/stock-matching.mjs';
import {withinWindow} from '../shared/standing.mjs';
async function perform(ctx:ActionCtx,args:{token?:string,id?:Id<'customTheses'>}):Promise<Infer<typeof standingResult>> {
 const claim=await ctx.runMutation(internal.standing.claim,args);if(claim.result)return claim.result;
 try {
 const now=Date.now(),windowEnd=new Date(now).toISOString().slice(0,10),windowStart=new Date(now-30*86400000).toISOString().slice(0,10);
 let evidence,researchReused=false;
 if(claim.stockId){
  const stock=getStockById(claim.stockId);if(!stock)throw Error('Not supported yet');
  const cache=await ctx.runMutation(internal.stockResearch.claim,{stockId:stock.id});
  if(cache.evidence){evidence=cache.evidence;researchReused=true;}
  else {try {evidence=await researchEvidence(ctx,{thesis:stock.name+' ('+stock.ticker+')',assumptions:[],windowStart,windowEnd});await ctx.runMutation(internal.stockResearch.finish,{stockId:stock.id,lease:cache.lease!,evidence});}catch(e){await ctx.runMutation(internal.stockResearch.finish,{stockId:stock.id,lease:cache.lease!});throw e;}}
  evidence={...evidence,verified:evidence.verified.filter(s=>withinWindow(s.date,windowStart,windowEnd)),windowStart,windowEnd};
 }else evidence=await researchEvidence(ctx,{thesis:claim.thesis,assumptions:claim.assumptions,windowStart,windowEnd,legacy:true});
 const result=await assessEvidence(ctx,{...evidence,thesis:claim.thesis,assumptions:claim.assumptions,researchReused});
 await ctx.runMutation(internal.standing.finish,{id:claim.id,key:claim.key,result});return result;
 }catch(e){await ctx.runMutation(internal.standing.finish,{id:claim.id,key:claim.key});throw e;}
}
export const check=action({args:{token:v.string()},returns:standingResult,handler:perform});
export const checkSaved=internalAction({args:{id:v.id('customTheses')},returns:standingResult,handler:perform});
