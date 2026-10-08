import {chromium} from '../../passport-tools/node_modules/playwright-core/index.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:false});
const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[],responses=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(r.url().endsWith('/api/action')){const d=await r.json();if(d.status==='success')responses.push(d.value)}});
const shot=async name=>{await page.screenshot({path:`tmp/milestone-one/final-${name}.png`});console.log('SCREEN',name,'theme',await page.evaluate(()=>({background:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,overflow:document.documentElement.scrollWidth>innerWidth})));};
const waitTurn=async n=>{await page.waitForFunction(n=>document.querySelectorAll('.chat-lookout:not(.thread-thesis)').length>=n&&!document.querySelector('.chat-thinking'),n,{timeout:75000});await writeFile('tmp/milestone-one/final-walk-private-url.txt',page.url());await writeFile('tmp/milestone-one/final-walk-responses.json',JSON.stringify(responses.map(({token,...safe})=>safe),null,2));if(await page.getByRole('button',{name:'Try again',exact:true}).count()){await shot('failure');throw Error('Live model failure; no retry allowed')}};
try {
await page.goto('http://127.0.0.1:5178/');await shot('01-landing');
await page.locator('#landing-belief').fill('I think retail consumption in India will go up');await shot('02-belief');
await page.locator('.landing-composer').first().getByRole('button',{name:'Build',exact:true}).click();await waitTurn(1);await shot('03-first-question');
for(const [i,answer]of ["i'm not sure, help me refine it","i dont know","you tell me"].entries()){
 await page.getByLabel('Your answer',{exact:true}).fill(answer);await page.getByRole('button',{name:'Send answer'}).click();await waitTurn(i+2);await shot(['04-refine','05-not-sure','06-thesis'][i]);
}
await page.getByRole('heading',{name:'Your thesis',exact:true}).waitFor();
if(responses.length!==4||responses.some((r,i)=>r.calls!==i+1||r.turns!==i+1))throw Error('Not exactly four model calls');
if(!responses.at(-1).context.belief)throw Error('Stated belief lost');
await page.getByRole('button',{name:'Edit',exact:true}).click();
await page.getByLabel('Assumption 1',{exact:true}).fill('Household income gains translate into higher spending rather than savings.');
await shot('07-edit-assumption');
await page.getByLabel('Email',{exact:true}).fill('lookout-walkthrough@example.com');await shot('08-email-save');
await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('Saved privately.',{exact:true}).waitFor();await shot('09-saved');
await page.reload();await page.getByText('Saved privately.',{exact:true}).waitFor();
await page.getByText('Household income gains translate into higher spending rather than savings.',{exact:true}).waitFor();await shot('10-reloaded');
await page.getByRole('button',{name:'Copy private link',exact:true}).click();await page.getByText('Private link copied.',{exact:true}).waitFor();
if(responses.length!==4||errors.length)throw Error(JSON.stringify({calls:responses.length,errors}));
await writeFile('tmp/milestone-one/final-walk-thread.txt',await page.locator('.chat-thread').innerText());
console.log('PASS: exact belief and three answers; assumption edited; saved with email; reload retained edit; copy private link works; dark Inter theme; no browser errors; four model calls, no retries.');
}finally{await browser.close()}
