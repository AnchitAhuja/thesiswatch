import {chromium} from '../../passport-tools/node_modules/playwright-core/index.mjs';import {readFile} from 'node:fs/promises';
const {token}=JSON.parse(await readFile('tmp/company-search-proof/session-private.json','utf8'));
const kind=process.argv.includes('--progress')?'progress':'results';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));for(const [width,height]of[[1280,1000],[390,844]]){
 await page.setViewportSize({width,height});await page.goto('https://fearless-ferret-257.convex.site/?create=holdings&session='+token);
 if(kind==='progress')await page.getByRole('heading',{name:'Checking the evidence...',exact:true}).waitFor({timeout:30000});else await page.locator('.holding-source-count').waitFor({timeout:180000});
 await page.locator('.lookout-brand-logo').evaluate(img=>img.decode());await page.evaluate(()=>document.fonts.ready);
 const proof=await page.evaluate(()=>({background:getComputedStyle(document.body).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth,title:document.querySelector('h1').innerText,stock:document.querySelector('.holding-company-identity').innerText,sector:document.querySelector('.holding-sector').innerText,step:document.querySelector('.holding-progress-footer')?.innerText,count:document.querySelector('.holding-source-count')?.innerText,reasons:[...document.querySelectorAll('.holding-reason-heading h3')].map(x=>x.innerText),statuses:[...document.querySelectorAll('.holding-status')].map(x=>x.innerText),horizon:document.body.innerText.includes('Checked against a 3-5 year view'),email:!!document.querySelector('#standing-email')}));
 if(proof.overflow||proof.background!=='rgb(12, 23, 18)'||!proof.stock.includes('NSE')||proof.sector!=='Logistics & Supply Chain'||!proof.email||!proof.horizon)throw Error(JSON.stringify(proof));
 await page.screenshot({path:`tmp/landing-proof/holdings-dark-${kind}-${width}.png`,fullPage:true});console.log(JSON.stringify({kind,width,...proof}));
 }if(errors.length)throw Error(errors.join(','));}finally{await browser.close();}
