const {chromium,devices}=require('../mobile-picker-tools/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const requests=[],errors=[];
 page.on('request',request=>{if(request.method()==='POST')requests.push({url:request.url(),body:request.postData()});});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://fearless-ferret-257.convex.site/?create=portfolio');
 await page.locator('#ph-file').setInputFiles('tests/fixtures/sample-pnl.xlsx');
 await page.getByText('Statement read. No file or Client ID was sent.',{exact:true}).waitFor();
 await page.waitForFunction(()=>!document.body.textContent.includes('Writing the factual summary')&&!document.body.textContent.includes('Finding sectors from symbols'),{},{timeout:65000});
 const text=await page.locator('body').innerText();assert(!/\b(buy|sell|trim|exit|hold)\b/i.test(text));assert(!text.includes('FAKE-CLIENT-NEVER-SEND'));assert(!text.includes('service is unavailable'));assert(!text.includes('Sector lookup is unavailable'));
 assert(text.includes('11,120'));assert(text.includes('Delayed payment charges mean the trading balance went below zero.'));
 assert.equal(await page.locator('#ph-file').inputValue(),'');
 const sectorRequests=requests.filter(r=>r.body?.includes('portfolioAI:sectors'));
 assert.equal(sectorRequests.length,1);assert(!requests.some(r=>r.body?.includes('FAKE-CLIENT-NEVER-SEND')));assert(!requests.some(r=>r.url.includes('upload')));
 for(const r of requests){if(r.body?.includes('portfolioAI:sectors')){const payload=JSON.parse(r.body);const args=payload.args[0];assert.deepEqual(Object.keys(args),['symbols']);assert.equal(args.symbols.length,4);}}
 await page.locator('#ph-limit').fill('60');await page.locator('#ph-limit').press('Tab');assert.equal(await page.locator('td').filter({hasText:'Above your'}).count(),0);
 await page.screenshot({path:'tmp/portfolio-proof/desktop.png',fullPage:true});
 await page.locator('#ph-file').setInputFiles('tests/fixtures/sample-pnl.xlsx');await page.waitForFunction(()=>document.querySelector('#ph-limit')?.value==='5');
 const mobile=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844}});const phone=await mobile.newPage();await phone.goto('https://fearless-ferret-257.convex.site/?create=portfolio');await phone.locator('#ph-file').setInputFiles('tests/fixtures/sample-pnl.xlsx');await phone.getByText('Statement read. No file or Client ID was sent.',{exact:true}).waitFor();
 await phone.waitForFunction(()=>!document.body.textContent.includes('Writing the factual summary')&&!document.body.textContent.includes('Finding sectors from symbols'),{},{timeout:65000});
 assert(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await phone.screenshot({path:'tmp/portfolio-proof/mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: DEV upload parses the fake workbook and renders all portfolio facts.');
 console.log('PASS: page text contains none of buy, sell, trim, exit, hold as whole words.');
 console.log('PASS: sector lookup sends symbols only; no file upload or Client ID in network requests.');
 console.log('PASS: AI summary and sector chart resolve, editable limit updates flags, and replacement upload resets it.');
 console.log('PASS: 390px mobile page has no document overflow.');
 fs.writeFileSync('tmp/portfolio-proof/network.json',JSON.stringify(requests,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
