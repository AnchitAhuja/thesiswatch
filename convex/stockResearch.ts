import {v} from 'convex/values';
import {internalMutation} from './_generated/server';
import {researchEvidenceFields} from './holdingsFields';
import {SOURCE_POLICY_VERSION} from '../shared/source-quality.mjs';
import {HOLDINGS_RESEARCH_VERSION} from '../shared/holdings-research.mjs';
import {evidenceLogger} from './evidenceLogging';
import {getStockById} from '../shared/stock-matching.mjs';
export const claim=internalMutation({args:{stockId:v.string(),reasons:v.array(v.string()),bypassCache:v.optional(v.boolean())},returns:v.object({lease:v.optional(v.string()),evidence:v.union(researchEvidenceFields,v.null())}),handler:async(ctx,{stockId,reasons,bypassCache})=>{
 if(bypassCache && process.env.CONVEX_CLOUD_URL!=='https://fearless-ferret-257.convex.cloud')throw Error('Dev cache bypass only.');
 if(!getStockById(stockId))throw Error('Not supported yet');
 const key=JSON.stringify([SOURCE_POLICY_VERSION,HOLDINGS_RESEARCH_VERSION+(process.env.CONVEX_CLOUD_URL==='https://fearless-ferret-257.convex.cloud'?':company-recent-meaning-v3':''),stockId,process.env.CONVEX_CLOUD_URL==='https://fearless-ferret-257.convex.cloud'?[]:reasons]);
 const log=evidenceLogger(getStockById(stockId)?.name||stockId,reasons);
 log('stockResearchCache lookup',{cacheKey:key});
 const row=await ctx.db.query('stockResearchCache').withIndex('by_key',q=>q.eq('key',key)).unique();
 if(!bypassCache&&row?.evidence&&Date.now()-row.evidence.researchedAt<7*86400000){log('stockResearchCache hit',{cacheKey:key,ageMs:Date.now()-row.evidence.researchedAt});return {evidence:row.evidence};}
 log('stockResearchCache miss',{cacheKey:key,why:bypassCache?'Dev bypass':row?.evidence?'Expired':'No evidence'});
 if(row?.busySince&&Date.now()-row.busySince<6*60000)throw Error('Research is already running for this stock. Try again shortly.');
 const lease=crypto.randomUUID();if(row)await ctx.db.patch(row._id,{lease,busySince:Date.now()});else await ctx.db.insert('stockResearchCache',{key,stockId,lease,busySince:Date.now()});
 return {lease,evidence:null};
}});
export const finish=internalMutation({args:{stockId:v.string(),reasons:v.array(v.string()),lease:v.string(),evidence:v.optional(researchEvidenceFields)},returns:v.null(),handler:async(ctx,args)=>{
 const key=JSON.stringify([SOURCE_POLICY_VERSION,HOLDINGS_RESEARCH_VERSION+(process.env.CONVEX_CLOUD_URL==='https://fearless-ferret-257.convex.cloud'?':company-recent-meaning-v3':''),args.stockId,process.env.CONVEX_CLOUD_URL==='https://fearless-ferret-257.convex.cloud'?[]:args.reasons]);
 const row=await ctx.db.query('stockResearchCache').withIndex('by_key',q=>q.eq('key',key)).unique();
 if(row?.lease===args.lease)await ctx.db.patch(row._id,{busySince:undefined,lease:undefined,...(args.evidence?{evidence:args.evidence}:{})});return null;
}});

export const clearForDev=internalMutation({args:{stockId:v.string()},returns:v.number(),handler:async(ctx,{stockId})=>{
 if(process.env.CONVEX_CLOUD_URL!=='https://fearless-ferret-257.convex.cloud')throw Error('Dev deployment required.');
 if(!getStockById(stockId))throw Error('Not supported yet');
 const rows=await ctx.db.query('stockResearchCache').withIndex('by_stock_id',q=>q.eq('stockId',stockId)).take(1000);
 if(rows.some(row=>row.busySince&&Date.now()-row.busySince<6*60000))throw Error('Research is running; wait before clearing its cache.');
 for(const row of rows)await ctx.db.delete(row._id);return rows.length;
}});
