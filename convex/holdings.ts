import {v} from 'convex/values';
import {query,mutation,internalQuery,internalMutation} from './_generated/server';
import {digest} from './theses';
import {holdingInput,holdingLine,stockMatch} from './holdingsFields';
import {standingResult} from './standingFields';
import {matchStock,restricted} from '../shared/stock-matching.mjs';
const sessionView=v.object({confirmed:v.boolean(),email:v.optional(v.string()),lines:v.array(v.object({stock:v.string(),reasons:v.array(v.string()),match:v.union(stockMatch,v.null()),error:v.optional(v.string()),result:v.union(standingResult,v.null())}))});
export const match=query({args:{name:v.string()},returns:v.union(stockMatch,v.null()),handler:async(_ctx,{name})=>matchStock(name)});
export const create=internalMutation({args:{token:v.string(),original:v.string(),items:v.array(holdingInput)},returns:v.null(),handler:async(ctx,args)=>{
 const tokenHash=await digest(args.token);if(await ctx.db.query('holdingSessions').withIndex('by_token_hash',q=>q.eq('tokenHash',tokenHash)).unique())throw Error('This draft already exists.');
 await ctx.db.insert('holdingSessions',{tokenHash,original:args.original,createdAt:Date.now(),lines:args.items.map(item=>({...item,match:matchStock(item.stock)}))});return null;
}});
export const read=query({args:{token:v.string()},returns:v.union(sessionView,v.null()),handler:async(ctx,{token})=>{
 const tokenHash=await digest(token);const row=await ctx.db.query('holdingSessions').withIndex('by_token_hash',q=>q.eq('tokenHash',tokenHash)).unique();if(!row)return null;
 const lines=await Promise.all(row.lines.map(async line=>{const thesis=line.thesisId?await ctx.db.get(line.thesisId):null;return {stock:line.stock,reasons:line.reasons,match:line.match,error:line.error,result:line.error?null:thesis?.standingResult||null};}));
 return {confirmed:!!row.confirmedAt,email:row.email,lines};
}});
export const confirm=mutation({args:{token:v.string(),items:v.array(holdingInput)},returns:v.null(),handler:async(ctx,{token,items})=>{
 const tokenHash=await digest(token),session=await ctx.db.query('holdingSessions').withIndex('by_token_hash',q=>q.eq('tokenHash',tokenHash)).unique();
 if(!session)throw Error('This draft could not be found.');if(session.confirmedAt)throw Error('This draft is already confirmed.');
 if(!items.length||items.length>10)throw Error('Enter between one and ten stocks.');
 const lines=[];for(const item of items){
 if(!item.stock.trim()||item.stock.length>150||item.reasons.length>6||item.reasons.some(r=>!r.trim()||r.length>500)||restricted(item.stock+' '+item.reasons.join(' ')))throw Error('Please rephrase the highlighted entry before checking.');
 const match=matchStock(item.stock);if(!match){lines.push({...item,match:null,error:'Not supported yet'});continue;}
 if(!item.reasons.length){lines.push({...item,match,error:'Add your reason before checking.'});continue;}
 const privateToken=(crypto.randomUUID()+crypto.randomUUID()).replaceAll('-','');
 const thesis=match.name+': '+item.reasons.join('; ');
 const thesisId=await ctx.db.insert('customTheses',{tokenHash:await digest(privateToken),standingStockId:match.id,original:thesis,investments:[match.ticker],createdAt:Date.now(),state:'draft',interpretation:{belief:thesis,reflection:thesis,statedReasons:item.reasons,inferredAssumptions:item.reasons,unverifiedClaims:[],risks:[],strengtheningEvidence:[],weakeningEvidence:[]}});
 lines.push({...item,match,privateToken,thesisId});
 }
 await ctx.db.patch(session._id,{lines,confirmedAt:Date.now()});return null;
}});
export const get=internalQuery({args:{token:v.string()},returns:v.union(v.object({id:v.id('holdingSessions'),lines:v.array(holdingLine)}),v.null()),handler:async(ctx,{token})=>{
 const tokenHash=await digest(token),row=await ctx.db.query('holdingSessions').withIndex('by_token_hash',q=>q.eq('tokenHash',tokenHash)).unique();return row?{id:row._id,lines:row.lines}:null;
}});
export const recordError=internalMutation({args:{id:v.id('holdingSessions'),index:v.number(),error:v.optional(v.string())},returns:v.null(),handler:async(ctx,{id,index,error})=>{
 const row=await ctx.db.get(id);if(!row?.lines[index])throw Error('Entry not found.');const lines=[...row.lines];lines[index]={...lines[index],error};await ctx.db.patch(id,{lines});return null;
}});
export const recordEmail=internalMutation({args:{id:v.id('holdingSessions'),email:v.string()},returns:v.null(),handler:async(ctx,args)=>{await ctx.db.patch(args.id,{email:args.email});return null;}});
