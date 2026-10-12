import {v} from 'convex/values';
import {standingSource,searchAuditEntry} from './standingFields';
export const holdingProgressStep=v.union(v.literal('Searching recent news'),v.literal('Searching brokerage reports'),v.literal('Searching quarterly results'),v.literal('Reading source articles'),v.literal('Reading brokerage reports'),v.literal('Checking your reason against evidence'),v.literal('Verifying evidence matches your reason'),v.literal('Done'),v.literal('Stopped'));
export const holdingProgress=v.object({step:holdingProgressStep,updatedAt:v.number()});
export const stockMatch=v.object({id:v.string(),ticker:v.string(),name:v.string(),market:v.string(),aliases:v.array(v.string())});
export const holdingInput=v.object({stock:v.string(),reasons:v.array(v.string())});
export const holdingLine=v.object({stock:v.string(),reasons:v.array(v.string()),match:v.union(stockMatch,v.null()),thesisId:v.optional(v.id('customTheses')),privateToken:v.optional(v.string()),error:v.optional(v.string())});
export const researchEvidenceFields=v.object({queryTrace:v.optional(v.array(v.object({query:v.string(),raw:v.number(),afterDate:v.number(),afterCompany:v.number()}))),verified:v.array(v.object({...standingSource.fields,excerpt:v.string()})),searchAudit:v.array(searchAuditEntry),searches:v.number(),modelCalls:v.optional(v.number()),windowStart:v.string(),windowEnd:v.string(),researchedAt:v.number()});
