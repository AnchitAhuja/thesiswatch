// @vitest-environment jsdom
import {it,expect} from 'vitest';
import {renderHoldingsStock} from '../src/holdings-results.mjs';
it('keeps each original reason, status, strength, evidence and credited source together',()=>{
 const reason='exact user words & case';const line={stock:'Delhivery',match:{name:'Delhivery Ltd.',ticker:'DELHIVERY',market:'India'},reasons:[reason,'another exact reason'],progress:{step:'Done'},result:{windowStart:'2026-09-12',windowEnd:'2026-10-12',assumptions:[{assumption:reason,status:'WATCH',signalStrength:'soft',reason:'Broker (reported 2026-10-09) stated: exact credited evidence.',sources:[{url:'https://publisher.example/news',title:'Exact source headline',publisher:'publisher.example',date:'2026-10-09',dateVerification:'Publisher date metadata'}]},{assumption:'another exact reason',status:'No new evidence',signalStrength:'soft',reason:'no clear evidence in the last 30 days',sources:[]}]}};
 document.body.innerHTML=renderHoldingsStock(line);
 expect(document.querySelector('h2')?.textContent).toBe('Delhivery Ltd.');expect(document.body.textContent).toContain('DELHIVERY');expect(document.body.textContent).toContain('2026-09-12 to 2026-10-12');
 const rows=document.querySelectorAll('.holdings-reason');expect(rows).toHaveLength(2);
 expect(rows[0].querySelector('h3')?.textContent).toBe(reason);expect(rows[0].textContent).toContain('WATCH');expect(rows[0].textContent).toContain('Signal strength: soft');expect(rows[0].textContent).toContain('exact credited evidence');expect(rows[0].querySelector('a')?.getAttribute('href')).toBe('https://publisher.example/news');expect(rows[0].textContent).toContain('publisher.example');expect(rows[0].textContent).toContain('2026-10-09');
 expect(rows[1].textContent).toContain('another exact reason');expect(rows[1].textContent).toContain('No new evidence');expect(rows[1].querySelector('a')).toBeNull();
});
