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
