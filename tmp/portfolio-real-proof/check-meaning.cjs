const {chromium}=require('../mobile-picker-tools/node_modules/playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});const noteRequests=[];page.on('request',r=>{if(r.postData()?.includes('portfolioAI:whyNotes'))noteRequests.push(JSON.parse(r.postData()));});
 await page.goto(process.argv[2]||'http://127.0.0.1:5173/?create=portfolio');await page.locator('#ph-file').setInputFiles('tests/fixtures/sample-pnl.xlsx');
 await page.getByText('Statement read. No file or Client ID was sent.',{exact:true}).waitFor();
 await page.waitForFunction(()=>{const text=[...document.querySelectorAll('tbody td:last-child')].map(el=>el.textContent);return text.length>0&&!text.some(s=>s.includes('Writing factual note'));},{},{timeout:70000});
 const sentences=await page.locator('tbody td:last-child').allTextContents();
 const errors=await page.locator('.ph-ai-error').allTextContents();assert.equal(errors.length,0,errors.join('\n'));assert(sentences.length>0);for(const s of sentences){assert(!s.includes('unavailable'),s);assert(!/\b(buy|sell|trim|exit|hold|add|book|should|consider)\b|clean\s+up/i.test(s),s);assert(s.trim().split(/\s+/).length<25,s);assert(!/\b(target\w*|will|would|could|decrease|reduce|rebalance|reallocate)\b/i.test(s),s);}
 assert.equal(noteRequests.length,1);assert.equal(noteRequests[0].args[0].facts.length,6);assert(!JSON.stringify(noteRequests).includes('FAKE-CLIENT'));
 await page.locator('#ph-limit').fill('0.1');await page.locator('#ph-limit').press('Tab');
 const changed=await page.locator('tbody td:last-child').allTextContents();assert(changed.every(s=>!s.includes('Writing')&&!s.includes('unavailable')));
 await page.locator('#ph-limit').fill('60');await page.locator('#ph-limit').press('Tab');assert.equal(noteRequests.length,1);
 await page.locator('#ph-limit').fill('5');await page.locator('#ph-limit').press('Tab');assert.deepEqual(await page.locator('tbody td:last-child').allTextContents(),sentences);assert.equal(noteRequests.length,1);
 console.log('PASS: every live DEV Why cell has one note under 25 words and no banned words.');
 console.log('PASS: one request covers six distinct positions; repeated flags reuse the same note.');
 console.log('PASS: changing limits to 0.1%, 60%, and back to 5% uses cached notes with no additional AI request.');
 const names=await page.locator('tbody th').allTextContents();for(let i=0;i<sentences.length;i++)console.log(names[i]+': '+sentences[i]);
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
