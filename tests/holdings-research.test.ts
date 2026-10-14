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
  const checked=gateReasonMatch(row,{match,quotes:[{sourceUrl:source.url,quote:'The acquisition strengthens rural reach and network density.'}]},[source],false);
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

import {splitHoldingReasons,sourceAboutCompany} from '../shared/holdings-research.mjs';
it('splits every supplied reason verbatim without adding, merging or rewriting',()=>{
 expect(splitHoldingReasons('Tech intensive, dense network, cost optimisation')).toEqual(['Tech intensive','dense network','cost optimisation']);
 expect(splitHoldingReasons('R&D and delivery; Scale\nScale')).toEqual(['R&D and delivery','Scale','Scale']);
});
it('rejects sources about other companies and incidental company mentions',()=>{
 expect(sourceAboutCompany('Delhivery Ltd.','Delhivery expands its network','Delhivery added new delivery centres.')).toBe(true);
 expect(sourceAboutCompany('Delhivery Ltd.','Amazon expands its network','Amazon added new delivery centres.')).toBe(false);
 expect(sourceAboutCompany('Delhivery Ltd.','Amazon expands its network','Competitors include Delhivery.')).toBe(false);
 expect(holdingsQueries('Delhivery Ltd.',splitHoldingReasons('Tech intensive, dense network, cost optimisation')).every(query=>query.includes('Delhivery'))).toBe(true);
});

import {validateStanding} from '../shared/standing.mjs';
it('keeps indirect statuses and credited sources as soft analyst evidence',()=>{
 const source={url:'https://publisher.example/article',title:'Delhivery costs',publisher:'publisher.example',date:'2026-10-09',dateVerification:'Publisher date',excerpt:'PL Capital said technology lowers costs.'};
 for(const status of ['INTACT','WEAKENING','WATCH','STRENGTHENING']){
  const row={status,signalStrength:'hard',reason:'Technology affects costs.',sourceUrls:[source.url],brokerageEvidence:[{firm:'PL Capital',sourceUrl:source.url,reasoning:'technology lowers costs.'}]};
  const checked=gateReasonMatch(row,{match:'indirect',explanation:'The firm forecasts savings; the company has not reported them.',quotes:[]},[source]);
  const attributed=attributeBrokerage(checked,[source]);
  const final=validateStanding({takeaway:'Evidence remains relevant.',assumptions:[attributed]},['technology helps reduce delivery costs'],[source]).assumptions[0];
  expect(final.status).toBe(status);expect(final.signalStrength).toBe('soft');expect(final.sources[0].url).toBe(source.url);
  expect(final.indirectEvidence).toEqual({explanation:'The firm forecasts savings; the company has not reported them.',firms:[{firm:'PL Capital',sourceUrl:source.url}]});
 }
 const row={status:'INTACT',signalStrength:'hard',reason:'Draft',sourceUrls:[source.url],brokerageEvidence:[]};
 for(const match of ['none','unrelated'])expect(gateReasonMatch(row,{match,explanation:'No connection.',quotes:[]},[source]).status).toBe('No new evidence');
 for(const match of ['direct','indirect'])expect(gateReasonMatch({...row,sourceUrls:[]},{match,explanation:'No sources.',quotes:[]},[source]).status).toBe('No new evidence');
});
