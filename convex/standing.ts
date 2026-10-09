import { v } from 'convex/values';
import { internalMutation, mutation } from './_generated/server';
import { digest } from './theses';
import { standingResult } from './standingFields';
import { SOURCE_POLICY_VERSION } from '../shared/source-quality.mjs';
export const claim = internalMutation({
 args: { token: v.optional(v.string()), id:v.optional(v.id('customTheses')) }, returns: v.object({ id: v.id('customTheses'), thesis: v.string(), assumptions: v.array(v.string()), key: v.string(), result: v.union(standingResult,v.null()) }),
 handler: async (ctx,{token,id}) => {
  const hash = token ? await digest(token) : '';
  const row = id ? await ctx.db.get(id) : await ctx.db.query('customTheses').withIndex('by_token_hash',q=>q.eq('tokenHash',hash)).unique();
  if (!row?.interpretation) throw Error('This thesis is not ready.');
  const thesis = row.confirmedReflection || row.thesis?.thesis || row.interpretation.reflection;
  const assumptions = row.thesis?.assumptions || row.interpretation.inferredAssumptions;
  if (assumptions.length !== 3) throw Error('Three assumptions are required.');
  const key = JSON.stringify([SOURCE_POLICY_VERSION, thesis, assumptions]);
  const cached = row.standingKey === key && row.standingResult && Date.now()-row.standingResult.checkedAt < 86400000 ? row.standingResult : null;
  if (!cached && row.standingBusySince && Date.now()-row.standingBusySince < 600000) throw Error('A check is already running. Try again shortly.');
  if (!cached) await ctx.db.patch(row._id,{standingBusySince:Date.now(),standingKey:key,standingResult:undefined});
  return {id:row._id,thesis,assumptions,key,result:cached};
 }
});
export const finish = internalMutation({
 args: { id:v.id('customTheses'),key:v.string(),result:v.optional(standingResult) },returns:v.null(),
 handler:async(ctx,args)=> { const row=await ctx.db.get(args.id); if(row?.standingKey===args.key) await ctx.db.patch(args.id,{standingBusySince:undefined,...(args.result?{standingResult:args.result}:{})}); return null; }
});
export const subscribe = mutation({
 args:{token:v.string(),email:v.string()},returns:v.null(),handler:async(ctx,{token,email})=>{
  email=email.trim().toLowerCase(); if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('Enter a valid email address.');
  const hash=await digest(token); const row=await ctx.db.query('customTheses').withIndex('by_token_hash',q=>q.eq('tokenHash',hash)).unique();
  if(!row?.standingResult) throw Error('Check your thesis first.');
  await ctx.db.patch(row._id,{standingEmail:email,standingSubscribedAt:Date.now(),standingActive:true,standingUnsubscribeToken:row.standingUnsubscribeToken || crypto.randomUUID()}); return null;
 }
});
