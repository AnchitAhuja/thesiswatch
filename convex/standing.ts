import { v } from 'convex/values';
import { internalMutation, mutation } from './_generated/server';
import { digest } from './theses';
import { standingResult } from './standingFields';
import {holdingProgressStep} from './holdingsFields';
import {HOLDINGS_RESEARCH_VERSION,HOLDINGS_ASSESSMENT_VERSION} from '../shared/holdings-research.mjs';
import { SOURCE_POLICY_VERSION } from '../shared/source-quality.mjs';
export const claim = internalMutation({
 args: { token: v.optional(v.string()), id:v.optional(v.id('customTheses')) }, returns: v.object({ id: v.id('customTheses'), thesis: v.string(), assumptions: v.array(v.string()), stockId:v.optional(v.string()), key: v.string(), result: v.union(standingResult,v.null()) }),
 handler: async (ctx,{token,id}) => {
  const hash = token ? await digest(token) : '';
  const row = id ? await ctx.db.get(id) : await ctx.db.query('customTheses').withIndex('by_token_hash',q=>q.eq('tokenHash',hash)).unique();
  if (!row?.interpretation) throw Error('This thesis is not ready.');
  const thesis = row.confirmedReflection || row.thesis?.thesis || row.interpretation.reflection;
  const assumptions = row.thesis?.assumptions || row.interpretation.inferredAssumptions;
  if (row.standingStockId ? assumptions.length<1||assumptions.length>6 : assumptions.length !== 3) throw Error('Valid reasons are required.');
  const holding=!!row.standingStockId;
  const normalize=(reason:string)=>reason.toLowerCase().trim().replace(/\s+/g,' ').replace(/^its /,'');
  const key = JSON.stringify([SOURCE_POLICY_VERSION, row.standingStockId?HOLDINGS_RESEARCH_VERSION+(process.env.CONVEX_CLOUD_URL==='https://fearless-ferret-257.convex.cloud'?':company-combined-v5':':company-combined-v4')+':'+HOLDINGS_ASSESSMENT_VERSION:null, holding?row.standingStockId:thesis, holding?assumptions.map(normalize):assumptions]);
  const shared=holding?await ctx.db.query('customTheses').withIndex('by_standing_key',q=>q.eq('standingKey',key)).order('desc').take(100):[];
  const saved=shared.find(item=>item.standingResult&&Date.now()-item.standingResult.checkedAt<86400000)?.standingResult;
  const cachedLocal = row.standingKey === key && row.standingResult && Date.now()-row.standingResult.checkedAt < 86400000 ? row.standingResult : null;
  const reusable=cachedLocal||saved;
  const cached=holding&&reusable?{...reusable,assumptions:reusable.assumptions.map((item,index)=>({...item,assumption:assumptions[index]})),...(reusable.reasonArticleMatches?{reasonArticleMatches:reusable.reasonArticleMatches.map((item,index)=>({...item,reason:assumptions[index]}))}:{})}:cachedLocal;
  if (!cached && row.standingBusySince && Date.now()-row.standingBusySince < 600000) throw Error('A check is already running. Try again shortly.');
  if (!cached) await ctx.db.patch(row._id,{standingBusySince:Date.now(),standingKey:key,standingResult:undefined,standingProgress:undefined});
  else if(row.standingStockId)await ctx.db.patch(row._id,{standingKey:key,standingResult:cached,standingProgress:{step:'Done',updatedAt:Date.now()}});
  return {id:row._id,thesis,assumptions,stockId:row.standingStockId,key,result:cached};
 }
});
export const progress=internalMutation({args:{id:v.id('customTheses'),key:v.string(),step:holdingProgressStep},returns:v.null(),handler:async(ctx,{id,key,step})=>{
 const row=await ctx.db.get(id);if(row?.standingKey===key&&row.standingBusySince)await ctx.db.patch(id,{standingProgress:{step,updatedAt:Date.now()}});return null;
}});
export const finish = internalMutation({
 args: { id:v.id('customTheses'),key:v.string(),result:v.optional(standingResult),unavailable:v.optional(v.boolean()) },returns:v.null(),
 handler:async(ctx,args)=> { const row=await ctx.db.get(args.id); if(row?.standingKey===args.key) await ctx.db.patch(args.id,{standingBusySince:undefined,...(row.standingStockId?{standingProgress:{step:args.unavailable?"Couldn't check right now" as const:args.result?'Done' as const:'Stopped' as const,updatedAt:Date.now()}}:{}),...(args.result?{standingResult:args.result}:{})}); return null; }
});
export const subscribe = mutation({
 args:{token:v.string(),email:v.string()},returns:v.null(),handler:async(ctx,{token,email})=>{
  email=email.trim().toLowerCase(); if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('Enter a valid email address.');
  const hash=await digest(token); const row=await ctx.db.query('customTheses').withIndex('by_token_hash',q=>q.eq('tokenHash',hash)).unique();
  if(!row?.standingResult && !row?.standingStockId) throw Error('Check your thesis first.');
  await ctx.db.patch(row._id,{standingEmail:email,standingSubscribedAt:Date.now(),standingActive:true,standingUnsubscribeToken:row.standingUnsubscribeToken || crypto.randomUUID()}); return null;
 }
});
