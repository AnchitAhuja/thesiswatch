import {it,expect} from 'vitest';
import {assembleMeaningMatches} from '../shared/meaning-matches.mjs';
it('copies selected passages verbatim and associates articles with each exact reason',()=>{
 const sources=[{url:'https://example.com/news',title:'Actual title',date:'2026-10-10',publisher:'example.com',dateVerification:'metadata',excerpt:'Routing software automates deliveries.\n\nIntegration costs affect operating expenses.\n\nStock-price distraction.'}];
 const reasons=['tech intensive company','cost optimization'];
 const result=assembleMeaningMatches({articles:[{sourceUrl:sources[0].url,reasonIndices:[0,1],paragraphIndices:[0,1]}]},sources,reasons);
 expect(result.packets[0].excerpt).toBe('Routing software automates deliveries.\n\nIntegration costs affect operating expenses.');expect(result.reasonArticleMatches.map(row=>row.reason)).toEqual(reasons);expect(result.reasonArticleMatches.every(row=>row.sources[0].url===sources[0].url)).toBe(true);
 expect(()=>assembleMeaningMatches({articles:[{sourceUrl:sources[0].url,reasonIndices:[0],paragraphIndices:[99]}]},sources,reasons)).toThrow();
});
