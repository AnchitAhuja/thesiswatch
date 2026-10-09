"use node";
import { randomBytes,createHash } from 'node:crypto';
import { v,type Infer } from 'convex/values';
import { action } from './_generated/server';
import { internal,api } from './_generated/api';
import { standingResult } from './standingFields';
export const check=action({args:{thesis_id:v.literal('ai-infrastructure'),token:v.optional(v.string())},returns:v.object({token:v.string(),result:standingResult}),handler:async(ctx,args):Promise<{token:string,result:Infer<typeof standingResult>}>=>{
 const token=args.token || randomBytes(32).toString('hex');
 if(!/^[a-f0-9]{64}$/.test(token)) throw Error('Invalid private check link.');
 await ctx.runMutation(internal.prebuilt.prepare,{tokenHash:createHash('sha256').update(token).digest('hex')});
 const result=await ctx.runAction(api.standingActions.check,{token});return {token,result};
}});
