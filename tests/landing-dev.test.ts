// @vitest-environment jsdom
import {it,expect,vi} from 'vitest';
import {bindLanding} from '../src/landing.mjs';
it('restores the original landing design with holdings as its only visible app destination on dev',()=>{
 vi.stubEnv('VITE_CONVEX_URL','https://fearless-ferret-257.convex.cloud');
 vi.stubGlobal('matchMedia',()=>({matches:true}));
 document.body.innerHTML='<div id="app"></div>';const root=document.querySelector('#app')!;
 bindLanding(root);
 expect(root.querySelector('h1')?.textContent).toBe('Invest. Then move on with your life');
 expect(root.querySelector('.family-photo')?.getAttribute('src')).toBe('/hero-family.webp');
 const form=root.querySelector('.landing-capture form')!;
 expect(form.getAttribute('action')).toBe('/?create=holdings');
 expect(form.querySelector('button')?.textContent).toBe('Get started');
 expect(root.querySelector<HTMLInputElement>('#landing-belief')?.hidden).toBe(true);
 expect(root.querySelector<HTMLElement>('.landing-ask')?.hidden).toBe(true);
 const links=[...root.querySelectorAll('a')].filter(link=>!link.closest('[hidden]'));
 expect(links.filter(link=>link.getAttribute('href')?.startsWith('/?')).map(link=>link.getAttribute('href'))).toEqual(['/?create=holdings']);
 expect(root.querySelector('.dark-intro')?.textContent).toBe("You don't need to follow every headline to stay on top of your investments. Lookout watches the reasons behind your decisions and lets you know when they're worth revisiting.");
 expect(root.querySelector('.dark-brand img')?.getAttribute('alt')).toBe('Lookout');
 expect(root.querySelector('.dark-header a[href="#how-it-works"]')?.textContent).toBe('How It Works');
 expect(root.querySelectorAll('#how-it-works li')).toHaveLength(3);
 expect(root.textContent).not.toContain('Sign in');
 vi.unstubAllEnvs();vi.unstubAllGlobals();
});
