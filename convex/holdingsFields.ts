import {v} from 'convex/values';
import {standingSource,searchAuditEntry} from './standingFields';
export const stockMatch=v.object({id:v.string(),ticker:v.string(),name:v.string(),market:v.string(),aliases:v.array(v.string())});
export const holdingInput=v.object({stock:v.string(),reasons:v.array(v.string())});
export const holdingLine=v.object({stock:v.string(),reasons:v.array(v.string()),match:v.union(stockMatch,v.null()),thesisId:v.optional(v.id('customTheses')),privateToken:v.optional(v.string()),error:v.optional(v.string())});
export const researchEvidenceFields=v.object({verified:v.array(v.object({...standingSource.fields,excerpt:v.string()})),searchAudit:v.array(searchAuditEntry),searches:v.number(),windowStart:v.string(),windowEnd:v.string(),researchedAt:v.number()});
