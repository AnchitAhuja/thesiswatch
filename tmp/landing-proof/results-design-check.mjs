import {chromium} from '../../passport-tools/node_modules/playwright-core/index.mjs';
import {readFile} from 'node:fs/promises';
const token=JSON.parse(await readFile('tmp/evidence-fix-proof/session-private.json','utf8')).token;
const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{const page=await b.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));for(const [width,height]of[[1280,1000],[390,844]]){
 await page.setViewportSize({width,height});await page.goto('https://fearless-ferret-257.convex.site/?create=holdings&session='+token);
 await page.locator('.holdings-results-layout').waitFor();await page.locator('.holding-sources a').first().waitFor();await page.evaluate(()=>document.fonts.ready);await page.locator('.lookout-brand-logo').evaluate(img=>img.decode());
 const checks=await page.evaluate(()=>({hasEvidence:document.querySelectorAll('.holding-sources a').length>0,hasNoEvidence:[...document.querySelectorAll('.holding-status')].some(e=>e.textContent==='No new evidence'),horizon:document.body.innerText.includes('Checked against a 3-5 year view'),email:!!document.querySelector('#standing-email'),overflow:document.documentElement.scrollWidth>innerWidth,sourceLinks:[...document.querySelectorAll('.holding-sources a')].map(a=>({title:a.textContent,url:a.href}))}));if(!checks.hasEvidence||!checks.hasNoEvidence||checks.overflow||!checks.horizon||!checks.email)throw Error(JSON.stringify(checks));
 await page.screenshot({path:`tmp/landing-proof/holdings-results-evidence-${width}.png`,fullPage:true});
 const empty=page.locator('.holdings-reason').filter({has:page.locator('.holding-status.no-evidence')}).first();await empty.screenshot({path:`tmp/landing-proof/holdings-results-no-evidence-${width}.png`});console.log(JSON.stringify({width,...checks}));
 }if(errors.length)throw Error(errors.join(','));console.log('No browser errors.');}finally{await b.close();}
