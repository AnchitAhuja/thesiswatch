const {chromium,devices}=require('../mobile-picker-tools/node_modules/playwright');
const assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const mobile=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844}});
 const page=await mobile.newPage();
 await page.goto('https://fearless-ferret-257.convex.site/?create=holdings');
 const input=page.locator('#holding-stock');await input.click();await input.pressSequentially('delh');
 const option=page.getByRole('option',{name:/Delhivery/});await option.waitFor({state:'visible'});
 const geometry=await option.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,topmost:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),viewport:innerWidth};});
 assert.equal(geometry.viewport,390);assert(geometry.x>=0&&geometry.x+geometry.width<=390&&geometry.topmost);
 await page.screenshot({path:'tmp/mobile-picker-proof/mobile-390.png'});
 await option.click();assert.equal(await input.inputValue(),'Delhivery Ltd.');assert.equal(await input.getAttribute('aria-expanded'),'false');
 await page.setViewportSize({width:390,height:400});await input.click();await input.fill('delh');await option.waitFor({state:'visible'});
 await page.waitForFunction(()=>{const r=document.querySelector('[role=option]').getBoundingClientRect();return r.y>=0&&r.bottom<=400;});
 await input.evaluate(el=>{el.value='nvid';el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'nvid'}));});await page.getByRole('option',{name:/NVIDIA/}).waitFor({state:'visible'});
 const desktop=await browser.newPage({viewport:{width:1280,height:900}});await desktop.goto('https://fearless-ferret-257.convex.site/?create=holdings');await desktop.locator('#holding-stock').fill('delh');await desktop.getByRole('option',{name:/Delhivery/}).waitFor({state:'visible'});
 console.log(JSON.stringify({mobile:'390px iPhone 13 emulation',typed:'delh',visible:'Delhivery Ltd. · DELHIVERY · India',geometry,tapSelection:'passed',compositionend:'passed',reducedHeight400:'passed',desktop:'passed'}));
 await browser.close();
})().catch(e=>{console.error(e.message);process.exitCode=1});

