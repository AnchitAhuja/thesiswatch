import {chromium} from '../../passport-tools/node_modules/playwright-core/index.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[],responses=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(r.url().endsWith('/api/action')){try{const data=await r.json();if(data.status==='success')responses.push(data.value);}catch{}}});
await page.goto('http://127.0.0.1:5178/');await page.locator('#landing-belief').fill("India's retail consumption growth amid rising disposable income");await page.locator('.landing-composer').first().getByRole('button',{name:'Build',exact:true}).click();
const waitTurn=async n=>{await page.waitForFunction(n=>document.querySelectorAll('.chat-lookout:not(.thread-thesis)').length>=n&&!document.querySelector('.chat-thinking'),n,{timeout:75000});if(await page.getByRole('button',{name:'Try again',exact:true}).count()){console.log(JSON.stringify(responses.map(({token,...safe})=>safe),null,2)); console.log(await page.locator('.chat-thread').innerText()); await browser.close(); throw Error('Model call failed; stopped without retry');}};
await waitTurn(1);
for(const [i,answer]of ["I believe wages rising faster than living costs will leave Indian households more money for discretionary spending. My time horizon is five years.","I would rethink it if household spending stays flat for two years despite rising real incomes, or retail sales volumes fall persistently.","Yes. My reason is real income growth leading to more discretionary spending, my horizon is five years, and flat spending despite rising real incomes would prove me wrong."].entries()){
 await page.getByLabel('Your answer',{exact:true}).fill(answer);await page.getByRole('button',{name:'Send answer'}).click();await waitTurn(i+2);
}
await page.getByRole('heading',{name:'Your thesis',exact:true}).waitFor();
if(responses.length!==4)throw Error(`Expected four action responses, got ${responses.length}`);
if(responses.some((r,i)=>r.calls!==i+1||r.turns!==i+1))throw Error('Counters not one model call per turn');
if(await page.locator('.thread-thesis-paper > ol > li').count()!==3)throw Error('Not exactly three assumptions');
for(const width of [1280,390]){
 await page.setViewportSize({width,height:900});
 const height=await page.evaluate(()=>Math.ceil(document.querySelector('.chat-thread').scrollHeight+document.querySelector('.chat-header').getBoundingClientRect().height+document.querySelector('.chat-input-area').getBoundingClientRect().height+50));
 await page.setViewportSize({width,height});await page.screenshot({path:`tmp/milestone-one/clear-retail-thread-${width}.png`});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');
}
await writeFile('tmp/milestone-one/clear-retail-private-url.txt',page.url());
await writeFile('tmp/milestone-one/clear-retail-responses.json',JSON.stringify(responses.map(({token,...safe})=>safe),null,2));

console.log(JSON.stringify(responses.map(({token,...safe})=>safe),null,2));
console.log(await page.locator('.chat-thread').innerText());
const finalResponse=responses.at(-1);
if(finalResponse.needsConfirmation||finalResponse.missingFields.length||Object.values(finalResponse.context).some(x=>!x))throw Error('Clear context was not retained');
await page.getByRole('button',{name:'Save',exact:true}).click();
await page.getByText('Saved privately.',{exact:true}).waitFor();
await page.reload();await page.getByText('Saved privately.',{exact:true}).waitFor();
if(responses.length!==4)throw Error('Save or reload caused an extra model call');
console.log('PASS: all four context fields retained; direct Save and reload succeeded; four model calls and zero retries.');
await browser.close();
