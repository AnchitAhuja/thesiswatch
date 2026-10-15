import {v} from 'convex/values';
import {internalQuery,internalMutation} from './_generated/server';
import {SECTORS} from '../shared/portfolio-health.mjs';
export const read=internalQuery({args:{symbols:v.array(v.string())},returns:v.record(v.string(),v.string()),handler:async(ctx,{symbols})=>{
 const result:Record<string,string>={};
 for(const symbol of symbols){const row=await ctx.db.query('portfolioSectors').withIndex('by_symbol',q=>q.eq('symbol',symbol)).unique();if(row&&Date.now()-row.updatedAt<180*86400000&&SECTORS.includes(row.sector))result[symbol]=row.sector;}
 return result;
}});
export const save=internalMutation({args:{sectors:v.record(v.string(),v.string())},returns:v.null(),handler:async(ctx,{sectors})=>{
 for(const [symbol,sector] of Object.entries(sectors)){
  if(!SECTORS.includes(sector))throw Error('Unknown sector.');
  const row=await ctx.db.query('portfolioSectors').withIndex('by_symbol',q=>q.eq('symbol',symbol)).unique();
  if(row)await ctx.db.patch(row._id,{sector,updatedAt:Date.now()});else await ctx.db.insert('portfolioSectors',{symbol,sector,updatedAt:Date.now()});
 }return null;
}});
