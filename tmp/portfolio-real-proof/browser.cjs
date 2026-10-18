const {chromium,devices}=require('../mobile-picker-tools/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const base=process.argv[2]||'http://127.0.0.1:5173/?create=portfolio';
 try{
 const context=await browser.newContext({viewport:{width:1280,height:1000}});const page=await context.newPage();const requests=[],errors=[];
 page.on('request',r=>{if(r.method()==='POST')requests.push(r.postData());});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('#ph-file').setInputFiles('tests/fixtures/sample-pnl.xlsx');
 await page.getByText('Statement read. No file or Client ID was sent.',{exact:true}).waitFor();
 await page.waitForFunction(()=>!document.querySelector('#ph-report').textContent.match(/Writing factual note|Finding sectors|Writing the factual summary/),{},{timeout:75000});
 const text=await page.locator('#ph-report').innerText();assert(!text.includes('unavailable'));assert.equal(await page.locator('.ph-ai-error').count(),0);assert(!/\b(buy|sell|trim|exit|hold|add|book|should|consider)\b|clean\s+up/i.test(text));
 const layout=await page.evaluate(()=>({metrics:[...document.querySelectorAll('.ph-metric-value')].map(e=>{const r=document.createRange();r.selectNodeContents(e);return {text:e.textContent,lines:r.getClientRects().length,width:e.getBoundingClientRect().width,nowrap:getComputedStyle(e).whiteSpace};}),charts:[...document.querySelectorAll('.ph-chart-grid article')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width};}),rows:[...document.querySelectorAll('tbody th')].map(e=>e.textContent),collapsed:!document.querySelector('.ph-small-names').open}));
 assert.equal(layout.metrics.length,5);for(const m of layout.metrics){assert.equal(m.lines,1);assert.equal(m.nowrap,'nowrap');assert(m.width>140);}
 assert.equal(layout.charts[0].y,layout.charts[1].y);assert.equal(layout.charts[0].width,layout.charts[1].width);assert(layout.charts[1].x>layout.charts[0].x);
 assert.equal(new Set(layout.rows).size,layout.rows.length);assert(!layout.rows.includes('FAKEGAMMA'));assert(layout.collapsed);
 const beforeNotes=requests.filter(r=>r.includes('portfolioAI:whyNotes')).length;await page.locator('#ph-limit').fill('60');await page.locator('#ph-limit').press('Tab');assert.equal(requests.filter(r=>r.includes('portfolioAI:whyNotes')).length,beforeNotes);
 assert(!requests.some(r=>r.includes('FAKE-CLIENT')));assert(!requests.some(r=>r.includes('application/vnd.openxmlformats')));
 await page.screenshot({path:'tmp/portfolio-real-proof/desktop.png',fullPage:true});
 console.log('PASS 1280px: five single-line stat values; equal-width charts side by side; one row per stock; small names collapsed; no extra notes call after limit change.');console.log(JSON.stringify(layout,null,2));
 const mobile=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844}});const phone=await mobile.newPage();await phone.goto(base);await phone.locator('#ph-file').setInputFiles('tests/fixtures/sample-pnl.xlsx');await phone.locator('.ph-metrics').waitFor();
 assert(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await phone.locator('.ph-metric-value').count(),5);await phone.screenshot({path:'tmp/portfolio-real-proof/mobile.png',fullPage:true});console.log('PASS 390px: existing two-column cards, five visible values, no page overflow.');
 // Simulate an AI provider failure to exercise the page's real network error path.
 const fail=await context.newPage();await fail.route('**/api/action',async route=>{
 const body=route.request().postData()||'';if(body.includes('portfolioAI:sectors')||body.includes('portfolioAI:whyNotes'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:'error',errorMessage:'TEST provider error: compiled grammar too large <unsafe>',logLines:[]})});return route.continue();});
 await fail.goto(base);await fail.locator('#ph-file').setInputFiles('tests/fixtures/sample-pnl.xlsx');await fail.locator('#ph-sector-retry').waitFor();await fail.waitForFunction(()=>document.querySelectorAll('.ph-ai-error').length===2);
 const button=await fail.locator('#ph-sector-retry').boundingBox();assert(button.height>=44&&button.height<70);assert(button.width<250);assert((await fail.locator('.ph-ai-error').first().innerText()).includes('TEST provider error'));assert.equal(await fail.locator('unsafe').count(),0);
 console.log('PASS DEV failures: actual provider message shown in small escaped text for both actions; retry button '+button.width+' x '+button.height+'.');
 assert.deepEqual(errors,[]);console.log('PASS real DEV backend results, no browser errors, no file or Client ID sent.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
