import {v} from 'convex/values';
import {internalMutation} from './_generated/server';
import {researchEvidenceFields} from './holdingsFields';
import {SOURCE_POLICY_VERSION} from '../shared/source-quality.mjs';
import {getStockById} from '../shared/stock-matching.mjs';
export const claim=internalMutation({args:{stockId:v.string()},returns:v.object({lease:v.optional(v.string()),evidence:v.union(researchEvidenceFields,v.null())}),handler:async(ctx,{stockId})=>{
 if(!getStockById(stockId))throw Error('Not supported yet');
 const key=SOURCE_POLICY_VERSION+':stock-wide-v1:'+stockId;
 const row=await ctx.db.query('stockResearchCache').withIndex('by_key',q=>q.eq('key',key)).unique();
 if(row?.evidence&&Date.now()-row.evidence.researchedAt<7*86400000)return {evidence:row.evidence};
 if(row?.busySince&&Date.now()-row.busySince<6*60000)throw Error('Research is already running for this stock. Try again shortly.');
 const lease=crypto.randomUUID();if(row)await ctx.db.patch(row._id,{lease,busySince:Date.now()});else await ctx.db.insert('stockResearchCache',{key,stockId,lease,busySince:Date.now()});
 return {lease,evidence:null};
}});
export const finish=internalMutation({args:{stockId:v.string(),lease:v.string(),evidence:v.optional(researchEvidenceFields)},returns:v.null(),handler:async(ctx,args)=>{
 const key=SOURCE_POLICY_VERSION+':stock-wide-v1:'+args.stockId;
 const row=await ctx.db.query('stockResearchCache').withIndex('by_key',q=>q.eq('key',key)).unique();
 if(row?.lease===args.lease)await ctx.db.patch(row._id,{busySince:undefined,lease:undefined,...(args.evidence?{evidence:args.evidence}:{})});return null;
}});
