import {chromium} from '../../passport-tools/node_modules/playwright-core/index.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[],responses=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(r.url().endsWith('/api/action')){try{const data=await r.json();if(data.status==='success')responses.push(data.value);}catch{}}});
await page.goto('http://127.0.0.1:5178/');await page.locator('#landing-belief').fill("India's retail consumption growth amid rising disposable income");await page.locator('.landing-composer').first().getByRole('button',{name:'Build',exact:true}).click();
const waitTurn=async n=>{await page.waitForFunction(n=>document.querySelectorAll('.chat-lookout:not(.thread-thesis)').length>=n&&!document.querySelector('.chat-thinking'),n,{timeout:75000});if(await page.getByRole('button',{name:'Try again',exact:true}).count())throw Error('Model call failed; inspect raw logs');};
await waitTurn(1);
for(const [i,answer]of ["i'm not sure, help me refine it","i dont know","you tell me"].entries()){
 await page.getByLabel('Your answer',{exact:true}).fill(answer);await page.getByRole('button',{name:'Send answer'}).click();await waitTurn(i+2);
}
await page.getByRole('heading',{name:'Your thesis',exact:true}).waitFor();
if(responses.length!==4)throw Error(`Expected four action responses, got ${responses.length}`);
if(responses.some((r,i)=>r.calls!==i+1||r.turns!==i+1))throw Error('Counters not one model call per turn');
if(await page.locator('.thread-thesis-paper > ol > li').count()!==3)throw Error('Not exactly three assumptions');
for(const width of [1280,390]){
 await page.setViewportSize({width,height:900});
 const height=await page.evaluate(()=>Math.ceil(document.querySelector('.chat-thread').scrollHeight+document.querySelector('.chat-header').getBoundingClientRect().height+document.querySelector('.chat-input-area').getBoundingClientRect().height+50));
 await page.setViewportSize({width,height});await page.screenshot({path:`tmp/milestone-one/retail-thread-${width}.png`});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');
}
await writeFile('tmp/milestone-one/retail-chat-private-url.txt',page.url());
await writeFile('tmp/milestone-one/retail-chat-responses.json',JSON.stringify(responses.map(({token,...safe})=>safe),null,2));
await page.reload();await page.getByRole('heading',{name:'Your thesis',exact:true}).waitFor();if(await page.locator('.chat-lookout:not(.thread-thesis)').count()!==4)throw Error('Reload lost actual conversation');
if(responses.length!==4)throw Error('Reload called model again');
await page.getByRole('button',{name:'Edit',exact:true}).click();
for(const [field,value]of Object.entries({belief:'Indian retail consumption grows as disposable income rises',why:'I expect higher disposable income to increase spending',whatWouldProveItWrong:'Household spending stays flat despite higher income',timeHorizon:'Five years'}))await page.locator(`#context-${field}`).fill(value);
await page.getByLabel('Email',{exact:true}).fill('lookout-dev-test@example.com');
await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('Saved privately.',{exact:true}).waitFor();await page.reload();await page.getByText('Saved privately.',{exact:true}).waitFor();
if(errors.length)throw Error(errors.join('\n'));
console.log(await page.locator('.chat-thread').innerText());
console.log(JSON.stringify(responses.at(-1).thesis,null,2));
console.log('PASS: exact retail belief and all three supplied answers; four model-backed turns and four action calls; three assumptions; complete thread screenshots at 1280px and 390px; reload adds no model call; Edit, confirm missing details, Save and private reload work.');await browser.close();
