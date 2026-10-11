import {it,expect} from 'vitest';
import {holdingsQueries,assertSearchRan} from '../shared/holdings-research.mjs';
it('searches exact reason keywords plus required brokerage and results queries without inventing reasons',()=>{
 const reasons=['one of the few tech delivery platforms','scale it is able to bring','network design is good'];
 expect(holdingsQueries('Delhivery Ltd.',reasons)).toEqual(['Delhivery tech delivery platforms','Delhivery scale','Delhivery network design','Delhivery brokerage report','Delhivery quarterly results']);
 expect(reasons).toEqual(['one of the few tech delivery platforms','scale it is able to bring','network design is good']);
 expect(()=>assertSearchRan([], 'Delhivery brokerage report')).toThrow('did not run');
 assertSearchRan([{toolName:'web_search',input:{query:'Delhivery brokerage report'}}], 'Delhivery brokerage report');
});
import {attributeBrokerage} from '../shared/holdings-research.mjs';
it('renders the firm and verified reporting date and rejects unattributed or unverified analyst claims',()=>{
 const source={url:'https://example.com/news',date:'2026-10-09',excerpt:'PL Capital said volume growth supports scale.'};
 const row={sourceUrls:[source.url],signalStrength:'hard',reason:'Our view',brokerageEvidence:[{firm:'PL Capital',sourceUrl:source.url,reasoning:'volume growth supports scale.'}]};
 expect(attributeBrokerage(row,[source]).reason).toBe('PL Capital (reported 2026-10-09) stated: volume growth supports scale.');
 expect(attributeBrokerage(row,[source]).signalStrength).toBe('soft');
 expect(()=>attributeBrokerage({...row,brokerageEvidence:undefined},[source])).toThrow();
 expect(()=>attributeBrokerage(row,[])).toThrow();
 expect(()=>attributeBrokerage({...row,brokerageEvidence:[{...row.brokerageEvidence[0],firm:'Invented firm'}]},[source])).toThrow();
});
import {gateReasonMatch} from '../shared/holdings-research.mjs';
it('does not let customer diversity validate scarcity or acquisition reach validate network design quality',()=>{
 const source={url:'https://example.com/news',excerpt:'MOFSL said diversified customers reduce concentration risk. The acquisition strengthens rural reach and network density. Express shipment volumes rose 55% YoY.'};
 const row={status:'INTACT',signalStrength:'soft',reason:'MOFSL stated...',sourceUrls:[source.url],brokerageEvidence:[]};
 for(const match of ['indirect','unrelated']){
  const checked=gateReasonMatch(row,{match,quotes:[{sourceUrl:source.url,quote:'The acquisition strengthens rural reach and network density.'}]},[source]);
  expect(checked.status).toBe('No new evidence');expect(checked.sourceUrls).toEqual([]);expect(checked.reason).toBe('no clear evidence in the last 30 days');
 }
 expect(gateReasonMatch(row,{match:'direct',quotes:[{sourceUrl:source.url,quote:'Express shipment volumes rose 55% YoY.'}]},[source]).status).toBe('INTACT');
 expect(()=>gateReasonMatch(row,{match:'direct',quotes:[{sourceUrl:source.url,quote:'Invented evidence'}]},[source])).toThrow('quote');
 expect(()=>gateReasonMatch(row,{match:'direct',quotes:[]},[source])).toThrow('quote');
});
it('renders only reviewed direct evidence and drops unrelated brokerage ratings from the draft',()=>{
 const source={url:'https://example.com/news',publisher:'example.com',date:'2026-10-09',excerpt:'MOFSL said express volumes grew 55% year on year.'};
 const row={status:'STRENGTHENING',signalStrength:'soft',reason:'Extra draft material',sourceUrls:[source.url],brokerageEvidence:[{firm:'Other broker',sourceUrl:source.url,reasoning:'Trading rating'}]};
 const checked=gateReasonMatch(row,{match:'direct',quotes:[{sourceUrl:source.url,firm:'MOFSL',quote:'express volumes grew 55% year on year.'}]},[source]);
 expect(attributeBrokerage(checked,[source]).reason).toBe('MOFSL (reported 2026-10-09) stated: express volumes grew 55% year on year.');
});
