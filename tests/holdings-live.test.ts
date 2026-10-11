// @vitest-environment jsdom
import {it,expect,vi} from 'vitest';
import {bindHoldings} from '../src/holdings.mjs';
it('shows the second stock as soon as it finishes while the first is running and preserves email input',async()=>{
 history.replaceState(null,'','/?create=holdings&session=test-token');document.body.innerHTML='<div id="app"></div>';
 const stock=(name:string)=>({stock:name,reasons:['exact original reason'],match:{name,ticker:name,market:'India'},result:null});
 let view={confirmed:true,lines:[stock('Delhivery'),stock('ITC')]},publish!:(view:any)=>void,finish!:()=>void;
 const action=new Promise<void>(resolve=>finish=resolve);
 const client={query:vi.fn(async()=>view),action:vi.fn(()=>action),onUpdate:vi.fn((_query:any,_args:any,callback:any)=>{publish=callback;return()=>{};}),close:vi.fn()};
 await bindHoldings(document.querySelector('#app'),client);
 const email=document.querySelector<HTMLInputElement>('#standing-email')!;email.value='my-email@example.com';email.focus();
 const button=document.querySelector<HTMLButtonElement>('#holdings-retry')!;button.click();
 const result={windowStart:'2026-09-11',windowEnd:'2026-10-11',assumptions:[{assumption:'exact original reason',status:'INTACT',signalStrength:'soft',reason:'Attributed evidence.',sources:[]}]};
 view={confirmed:true,lines:[{...stock('Delhivery'),progress:{step:'Searching recent news',updatedAt:1}},{...stock('ITC'),result,progress:{step:'Done',updatedAt:2}}]} as any;publish(view);
 expect(document.querySelector('[data-stock-result="0"]')?.textContent).toContain('Searching recent news');
 expect(document.querySelector('[data-stock-result="1"]')?.textContent).toContain('Attributed evidence.');
 expect(document.querySelector('#standing-email')).toBe(email);expect(email.value).toBe('my-email@example.com');expect(document.activeElement).toBe(email);
 expect(button.hidden).toBe(true);expect(document.body.textContent).toContain('Checked against a 3-5 year view');finish();await action;
});
