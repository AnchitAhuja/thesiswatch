// @vitest-environment jsdom
import {it,expect,vi} from 'vitest';
it.each(['https://fearless-ferret-257.convex.cloud','https://first-yak-309.convex.cloud'])('uses the current saved-list picker and exact reason box for %s',async url=>{
 vi.stubEnv('VITE_CONVEX_URL',url);
 const {bindHoldings}=await import('../src/holdings.mjs');
 history.replaceState(null,'','/');document.body.innerHTML='<div id="app"></div>';
 const client={action:vi.fn(),query:vi.fn(),close:vi.fn()};
 await bindHoldings(document.querySelector('#app'),client);
 expect(document.querySelector('h1')?.textContent).toBe('My holdings');
 expect(document.body.textContent).toContain('What makes you believe in these stocks?');
 expect(document.querySelectorAll('textarea')).toHaveLength(1);
 expect(document.querySelectorAll('datalist option').length).toBeGreaterThan(500);
 expect([...document.querySelectorAll('a')].map(a=>a.getAttribute('href'))).toEqual(['/','/']);
 const input=document.querySelector<HTMLInputElement>('#holding-stock')!;
 input.value='Unknown company';input.dispatchEvent(new Event('input'));
 expect(document.querySelector('#stock-match')?.textContent).toBe('Not supported yet');
 await (document.querySelector('form') as any).onsubmit({preventDefault(){},target:document.querySelector('form')});
 expect(client.action).not.toHaveBeenCalled();
 input.value='Delhivery';input.dispatchEvent(new Event('input'));
 expect(document.querySelector('#stock-match')?.textContent).toBe('');
 vi.unstubAllEnvs();
});
