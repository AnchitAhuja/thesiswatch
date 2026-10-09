import { v } from 'convex/values';
const confidence=v.union(v.literal('high'),v.literal('medium'),v.literal('low'));
const sourcedText=v.object({text:v.string(),source_ids:v.array(v.string())});
const company=v.object({id:v.string(),name:v.string(),exchange:v.string(),ticker:v.string(),role:v.string(),exposure:v.union(v.literal('direct'),v.literal('indirect')),evidence:v.string(),source_ids:v.array(v.string()),company_risk:v.string(),financial_indicators:v.array(v.object({name:v.string(),value:v.string(),period:v.string(),source_id:v.string()})),confidence,confidence_reason:v.string()});
export const prebuiltThesis=v.object({
 thesis_id:v.string(),title:v.string(),take:v.string(),belief:v.string(),summary:v.string(),investment_horizon:v.string(),geography:v.array(v.string()),markets:v.array(v.string()),investment_case:v.string(),structural_drivers:v.array(sourcedText),assumptions:v.array(v.string()),risks:v.array(v.string()),counterarguments:v.array(v.string()),
 stock_buckets:v.array(v.object({id:v.string(),title:v.string(),description:v.string(),company_ids:v.array(v.string())})),candidate_companies:v.array(company),approved_constituents:v.array(v.string()),invalidation_conditions:v.array(v.string()),monitoring_indicators:v.array(v.object({assumption_index:v.number(),indicator:v.string()})),
 current_status:v.union(v.string(),v.null()),status_explanation:v.string(),recent_evidence:v.array(sourcedText),source_references:v.array(v.object({id:v.string(),publisher:v.string(),title:v.string(),date:v.string(),reporting_period:v.string(),url:v.string(),confidence,current:v.boolean()})),last_verified_at:v.string(),data_quality_flags:v.array(v.string()),
});
