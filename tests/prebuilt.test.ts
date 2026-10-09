import {it,expect} from 'vitest';
import {convexTest} from 'convex-test';
import {JSDOM} from 'jsdom';
import schema from '../convex/schema';
import {api,internal} from '../convex/_generated/api';
import {aiInfrastructure} from '../shared/prebuilt-thesis.mjs';
import {thesisMarkup} from '../src/prebuilt-thesis.mjs';
const modules=import.meta.glob('../convex/**/*.ts');
it('validates the public Stage 1, 2 and 4 record and resolves all bucket and source references',async()=>{
 const t=convexTest(schema,modules),record=await t.query(api.prebuilt.read,{thesis_id:'ai-infrastructure'});
 expect(record.assumptions).toHaveLength(3);expect(record.approved_constituents).toEqual([]);expect(record.current_status).toBeNull();
 const count=record.summary.split(/\s+/).length;expect(count).toBeGreaterThanOrEqual(50);expect(count).toBeLessThanOrEqual(80);
 const ids=new Set(record.source_references.map(s=>s.id));
 for(const c of record.candidate_companies){for(const id of c.source_ids)expect(ids.has(id)).toBe(true);for(const m of c.financial_indicators)expect(ids.has(m.source_id)).toBe(true);}
 expect(record.stock_buckets.flatMap(b=>b.company_ids).sort()).toEqual(record.candidate_companies.map(c=>c.id).sort());
});
it('keeps checks private and refuses to overwrite another thesis',async()=>{
 const t=convexTest(schema,modules),tokenHash='a'.repeat(64);
 await t.mutation(internal.prebuilt.prepare,{tokenHash});await t.mutation(internal.prebuilt.prepare,{tokenHash});
 const rows=await t.run(ctx=>ctx.db.query('customTheses').collect());expect(rows).toHaveLength(1);expect(rows[0].interpretation?.inferredAssumptions).toEqual(aiInfrastructure.assumptions);
 await t.run(ctx=>ctx.db.patch(rows[0]._id,{original:'Different belief'}));
 await expect(t.mutation(internal.prebuilt.prepare,{tokenHash})).rejects.toThrow('different thesis');
 expect((await t.run(ctx=>ctx.db.get(rows[0]._id)))?.original).toBe('Different belief');
});
it('renders the requested order and all sourced company lines without trading instructions',()=>{
 const dom=new JSDOM(thesisMarkup(aiInfrastructure)),doc=dom.window.document;
 const headings=Array.from(doc.querySelectorAll('h2')).map(e=>e.textContent);
 expect(headings.slice(0,5)).toEqual(['The idea: power is part of the infrastructure.','Connected companies','Assumptions: three things that need to stay true.','Risks: where the idea could struggle.','What would break it']);
 expect(doc.querySelectorAll('.memo-company')).toHaveLength(6);
 for(const c of aiInfrastructure.candidate_companies)expect(doc.body.textContent).toContain(c.evidence);
 expect(doc.body.textContent).not.toMatch(/\b(buy|sell|hold)\b/i);
});
