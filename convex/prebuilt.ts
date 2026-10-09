import { v } from 'convex/values';
import { query,internalMutation } from './_generated/server';
import { prebuiltThesis } from './prebuiltFields';
import { aiInfrastructure } from '../shared/prebuilt-thesis.mjs';
export const read=query({args:{thesis_id:v.literal('ai-infrastructure')},returns:prebuiltThesis,handler:async()=>aiInfrastructure as import('convex/values').Infer<typeof prebuiltThesis>});
export const prepare=internalMutation({args:{tokenHash:v.string()},returns:v.null(),handler:async(ctx,{tokenHash})=>{
 const existing=await ctx.db.query('customTheses').withIndex('by_token_hash',q=>q.eq('tokenHash',tokenHash)).unique();
 const data=aiInfrastructure;
 if(existing){if(existing.original!==data.belief || JSON.stringify(existing.interpretation?.inferredAssumptions)!==JSON.stringify(data.assumptions) || (existing.confirmedReflection && existing.confirmedReflection!==data.belief)) throw Error('This private check belongs to a different thesis.');return null;}
 await ctx.db.insert('customTheses',{tokenHash,original:data.belief,investments:[],state:'draft',createdAt:Date.now(),interpretation:{belief:data.belief,reflection:data.belief,statedReasons:[],inferredAssumptions:data.assumptions,unverifiedClaims:[],risks:data.risks,strengtheningEvidence:[],weakeningEvidence:[]}});return null;
}});
