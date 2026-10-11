import {it,expect} from 'vitest';
import {checkStocksTogether} from '../shared/holdings-progress.mjs';
import {articleParagraphs,evidencePackets} from '../shared/evidence-packets.mjs';

it('starts both stocks before either finishes and does not make one failure block the other',async()=>{
 const starts:number[]=[],finishes:number[]=[];let finishFirst!:()=>void;
 const first=new Promise<void>(resolve=>finishFirst=resolve);
 const all=checkStocksTogether([{thesisId:'first'},{thesisId:'second'}],async(index:number)=>{
  starts.push(index);if(index===0)await first;else finishes.push(index);
 });
 await Promise.resolve();expect(starts).toEqual([0,1]);expect(finishes).toEqual([1]);finishFirst();await all;
 const checked:number[]=[];await checkStocksTogether([{thesisId:'first'},{thesisId:'second'}],async(index:number)=>{checked.push(index);if(index===0)throw Error('cap stop');});
 expect(checked).toEqual([0,1]);
});
it('sends only source metadata and up to three relevant paragraphs, preserving quotes and contrary evidence',()=>{
 const html='<nav><p>Subscribe to our newsletter today.</p></nav><article><p>'+('Unrelated sports coverage. '.repeat(25))+'</p><p>Express shipment volumes increased 55% year on year, supporting scale.</p><p>Network routing costs rose, creating a risk to network efficiency.</p><p>The brokerage discussed shipment demand and operating margins.</p></article>';
 const excerpt=articleParagraphs(html);
 const packets=evidencePackets([{title:'Logistics results',date:'2026-10-09',publisher:'example.com',url:'https://example.com/news',excerpt,dateVerification:'metadata'}],['scale','network design']);
 expect(Object.keys(packets[0]).sort()).toEqual(['date','excerpt','publisher','title','url']);
 expect(packets[0].excerpt).toContain('Express shipment volumes increased 55%');
 expect(packets[0].excerpt).toContain('Network routing costs rose');
 expect(packets[0].excerpt).not.toContain('Subscribe');expect(packets[0].excerpt).not.toContain('sports');
 expect(packets[0].excerpt.split('\n\n').length).toBeLessThanOrEqual(3);
 expect(packets[0].excerpt.length).toBeLessThanOrEqual(3604);
});

it('keeps attributed shipment evidence for a scale reason in older flat-text caches',()=>{
 const sources=[{title:'Report',date:'2026-10-09',publisher:'publisher',url:'https://example.com/report',excerpt:'Navigation tech delivery BT Bazaar Subscribe Home '+ 'menus '.repeat(100)+'. MOFSL stated that Express shipment volumes rose 55% YoY, led by e-commerce expansion. The brokerage said the acquisition strengthens rural reach and network density. Delhivery provides logistics and software services.'}];
 const packet=evidencePackets(sources,['scale it is able to bring','network design is good','one of the few tech delivery platforms'])[0];
 expect(packet.excerpt).toContain('MOFSL stated that Express shipment volumes rose 55%');
 expect(packet.excerpt).not.toContain('Navigation');
});
