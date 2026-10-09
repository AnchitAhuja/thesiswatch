import { v } from 'convex/values';
import { internalMutation,internalQuery } from './_generated/server';
import { internal,components } from './_generated/api';
import { Resend } from '@convex-dev/resend';
import { WorkflowManager } from '@convex-dev/workflow';
const workflow=new WorkflowManager(components.workflow,{workpoolOptions:{maxParallelism:1}});
const resend=new Resend(components.resend,{testMode:process.env.LOOKOUT_CUSTOM_EMAIL_LIVE!=='true'});
export const weekly = internalMutation({args:{cursor:v.optional(v.string())},returns:v.null(),handler:async(ctx,{cursor})=>{
 if(process.env.LOOKOUT_CUSTOM_SCHEDULE_ENABLED!=='true') return null;
 const page=await ctx.db.query('customTheses').withIndex('by_standing_active',q=>q.eq('standingActive',true)).paginate({cursor:cursor||null,numItems:25});
 const edition=new Date(Date.now()).toISOString().slice(0,10);
 for(const thesis of page.page) await workflow.start(ctx,internal.standingMail.deliver,{id:thesis._id,edition},{startAsync:true});
 if(!page.isDone) await ctx.scheduler.runAfter(0,internal.standingMail.weekly,{cursor:page.continueCursor});return null;
}});
export const deliver=workflow.define({args:{id:v.id('customTheses'),edition:v.string()},returns:v.null()}).handler(async(step,args):Promise<null>=>{
 if(!await step.runQuery(internal.standingMail.needsDelivery,args)) return null;
 await step.runAction(internal.standingActions.checkSaved,{id:args.id},{retry:false});
 await step.runMutation(internal.standingMail.enqueue,args);return null;
});
export const needsDelivery=internalQuery({args:{id:v.id('customTheses'),edition:v.string()},returns:v.boolean(),handler:async(ctx,{id,edition})=>{
 const row=await ctx.db.get(id);if(!row?.standingActive || !row.standingEmail) return false;
 return !await ctx.db.query('standingDeliveries').withIndex('by_thesis_edition',q=>q.eq('thesisId',id).eq('edition',edition)).unique();
}});
export const enqueue=internalMutation({args:{id:v.id('customTheses'),edition:v.string()},returns:v.null(),handler:async(ctx,{id,edition})=>{
 const row=await ctx.db.get(id);if(!row?.standingActive || !row.standingEmail || !row.standingResult || !row.standingUnsubscribeToken) return null;
 if(await ctx.db.query('standingDeliveries').withIndex('by_thesis_edition',q=>q.eq('thesisId',id).eq('edition',edition)).unique()) return null;
 const site=process.env.CONVEX_SITE_URL; if(!site) throw Error('Site URL is required.');
 const url=`${site}/api/standing-unsubscribe?token=${encodeURIComponent(row.standingUnsubscribeToken)}`;
 const result=row.standingResult;
 const text=[row.confirmedReflection||row.original,result.takeaway,`Evidence window: ${result.windowStart} through ${result.windowEnd}`,...result.assumptions.map(r=>`${r.assumption}\n${r.status} · Signal strength: ${r.signalStrength}\n${r.reason}\n${r.sources.map(s=>`${s.title} · ${s.publisher} · ${s.date}\n${s.url}`).join('\n')}`),`Unsubscribe: ${url}`].join('\n\n');
 const to=process.env.LOOKOUT_CUSTOM_EMAIL_LIVE==='true'?row.standingEmail:'delivered+test@resend.dev';
 const emailId=await resend.sendEmail(ctx,{from:'Lookout <onboarding@resend.dev>',to,subject:`Lookout — Where your thesis stands — ${edition}`,text,idempotencyKey:`standing:${id}:${edition}`,headers:[{name:'List-Unsubscribe',value:`<${url}>`},{name:'List-Unsubscribe-Post',value:'List-Unsubscribe=One-Click'}]});
 await ctx.db.insert('standingDeliveries',{thesisId:id,edition,emailId,queuedAt:Date.now()});return null;
}});
export const unsubscribe=internalMutation({args:{token:v.string(),confirm:v.boolean()},returns:v.boolean(),handler:async(ctx,{token,confirm})=>{
 const row=await ctx.db.query('customTheses').withIndex('by_standing_unsubscribe',q=>q.eq('standingUnsubscribeToken',token)).unique();if(!row) return false;
 if(confirm) await ctx.db.patch(row._id,{standingActive:false});return true;
}});
