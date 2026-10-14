import {it,expect} from 'vitest';
import {quoteCatalog,resolveEvidenceReferences} from '../shared/evidence-references.mjs';
import {gateReasonMatch,attributeBrokerage} from '../shared/holdings-research.mjs';
const source={url:'https://publisher.com/news',publisher:'Publisher',date:'2026-10-14',excerpt:'Routing technology reduced delivery costs by 10 percent. Firm A expects further cost reductions.'};
it('copies a selected quote verbatim and passes the unchanged direct evidence gate',()=>{
 const quotes=quoteCatalog([source]);expect(quotes.every(q=>source.excerpt.includes(q.quote))).toBe(true);
 const raw={assumptions:[{status:'STRENGTHENING',signalStrength:'hard',reason:'Costs fell.',citations:[{sourceUrl:source.url,brokerageEvidence:[],quoteId:quotes[0].id,quoteFirm:null}]}],reviews:[{match:'direct',explanation:'Costs measured.'}]};
 const resolved=resolveEvidenceReferences(raw,quotes);expect(()=>gateReasonMatch(resolved.assumptions[0],resolved.reviews[0],[source],true)).not.toThrow();
 expect(()=>resolveEvidenceReferences({...raw,assumptions:[{...raw.assumptions[0],citations:[{...raw.assumptions[0].citations[0],quoteId:'invented'}]}]},quotes)).toThrow('Unknown evidence quote');
});
it('ties every brokerage claim to its selected source and still rejects an invented firm',()=>{
 const row={status:'WATCH',signalStrength:'soft',reason:'Forecast.',citations:[{sourceUrl:source.url,brokerageEvidence:[{firm:'Firm A',reasoning:'Expects cost reductions.'}]}]};
 const resolved=resolveEvidenceReferences({assumptions:[row],reviews:[]},[]).assumptions[0];
 expect(resolved.brokerageEvidence[0].sourceUrl).toBe(resolved.sourceUrls[0]);expect(()=>attributeBrokerage(resolved,[source])).not.toThrow();
 expect(()=>attributeBrokerage({...resolved,brokerageEvidence:[{...resolved.brokerageEvidence[0],firm:'Invented Firm'}]},[source])).toThrow('Unverified brokerage');
});

it('resolves article paragraph IDs and rejects references to another source',()=>{
 const raw={articles:[{sourceUrl:source.url,reasonIndices:[0],paragraphIds:['s0p1']}],assumptions:[],reviews:[]};
 const paragraphs=[{id:'s0p1',sourceUrl:source.url,paragraphIndex:1,text:'A verified paragraph.'}];
 expect(resolveEvidenceReferences(raw,[],paragraphs).articles[0].paragraphIndices).toEqual([1]);
 expect(()=>resolveEvidenceReferences(raw,[],[{...paragraphs[0],sourceUrl:'https://other.com'}])).toThrow('Unknown article paragraph reference');
});
