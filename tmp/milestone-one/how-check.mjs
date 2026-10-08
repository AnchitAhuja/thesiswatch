import {chromium} from '../../passport-tools/node_modules/playwright-core/index.mjs';
const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const p=await b.newPage();let errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const width of [1280,390]){
 await p.setViewportSize({width,height:width===390?844:720});await p.goto('http://127.0.0.1:5178/');
 const section=p.locator('.how-it-works');await section.evaluate(el=>el.scrollIntoView({block:'start'}));await p.waitForFunction(()=>document.querySelector('.how-it-works').classList.contains('has-played')); await p.setViewportSize({width,height:Math.max(width===390?844:720,Math.ceil(await section.evaluate(el=>el.getBoundingClientRect().height))+40)}); await section.evaluate(el=>el.scrollIntoView({block:'start'}));
 await section.evaluate(el=>{window.playback=el.getAnimations({subtree:true});window.playback.forEach(a=>a.pause());});
 for(const [name,time]of[['start',100],['middle',2850],['end',5200]]){await p.evaluate(t=>window.playback.forEach(a=>a.currentTime=t),time);await p.screenshot({path:`tmp/milestone-one/how-${width}-${name}.png`});}
 const finished=await p.locator('.saturday-example').evaluate(el=>getComputedStyle(el).opacity);if(finished!=='1')throw new Error('Update not revealed');
 await p.evaluate(()=>scrollTo(0,0));await section.evaluate(el=>el.scrollIntoView({block:'start'}));if(!await section.evaluate(el=>el.classList.contains('has-played')))throw new Error('Lost played state');
 if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Overflow');
 await section.getByRole('link',{name:'Build my idea',exact:true}).click();if(!await p.locator('#landing-belief').evaluate(el=>el===document.activeElement))throw new Error('CTA failed');
 console.log(`PASS ${width}px: real CSS animation start/middle/end captured; once-only state retained; end visible; CTA focuses hero.`);
}
await p.emulateMedia({reducedMotion:'reduce'});await p.goto('http://127.0.0.1:5178/');const section=p.locator('.how-it-works');if(await section.evaluate(el=>el.classList.contains('motion-ready')))throw new Error('Reduced motion initialized animation');for(const selector of ['.reflection-example','.saturday-example'])if(await p.locator(selector).evaluate(el=>getComputedStyle(el).opacity)!=='1')throw new Error('Reduced motion hid a step');if(errors.length)throw new Error(JSON.stringify(errors));console.log('PASS: reduced motion shows all steps immediately; no browser errors.');await b.close();
