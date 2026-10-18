const {chromium}=require('../mobile-picker-tools/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage();await page.goto('https://fearless-ferret-257.convex.site/?create=portfolio');
 await page.locator('#ph-file').setInputFiles('tests/fixtures/sample-pnl.xlsx');
 await page.getByText('Statement read. No file or Client ID was sent.',{exact:true}).waitFor();
 assert((await page.locator('#ph-report').innerText()).includes('11,120'));
 assert((await page.locator('.ph-account div').filter({hasText:'Delayed payment charges'}).innerText()).includes('30.00'));
 assert(!(await page.locator('body').innerText()).includes('The first sheet needs'));
 console.log('PASS: published DEV page parses the column-B workbook; portfolio value is 11,120 and delayed payment charges are 30.00.');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
