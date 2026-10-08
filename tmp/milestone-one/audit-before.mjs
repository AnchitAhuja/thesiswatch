import {chromium} from '../../passport-tools/node_modules/playwright-core/index.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[],responses=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(r.url().endsWith('/api/action')){try{const data=await r.json();if(data.status==='success')responses.push(data.value);}catch{}}});
await page.goto('http://127.0.0.1:5178/');await page.screenshot({path:'tmp/milestone-one/audit-before-landing.png'});await page.locator('#landing-belief').fill("I think retail consumption in India will go up");await page.locator('.landing-composer').first().getByRole('button',{name:'Build',exact:true}).click();
const waitTurn=async n=>{await page.waitForFunction(n=>document.querySelectorAll('.chat-lookout:not(.thread-thesis)').length>=n&&!document.querySelector('.chat-thinking'),n,{timeout:75000});if(await page.getByRole('button',{name:'Try again',exact:true}).count()){console.log(JSON.stringify(responses.map(({token,...safe})=>safe),null,2)); console.log(await page.locator('.chat-thread').innerText()); await browser.close(); throw Error('Model call failed; stopped without retry');}};
await waitTurn(1);
for(const [i,answer]of ["i'm not sure, help me refine it","i dont know","you tell me"].entries()){
 await page.getByLabel('Your answer',{exact:true}).fill(answer);await page.getByRole('button',{name:'Send answer'}).click();await waitTurn(i+2);
}
await page.getByRole('heading',{name:'Your thesis',exact:true}).waitFor();
if(responses.length!==4)throw Error(`Expected four action responses, got ${responses.length}`);
if(responses.some((r,i)=>r.calls!==i+1||r.turns!==i+1))throw Error('Counters not one model call per turn');
if(await page.locator('.thread-thesis-paper > ol > li').count()!==3)throw Error('Not exactly three assumptions');

await page.screenshot({path:'tmp/milestone-one/audit-before-card.png'});
await page.getByRole('button',{name:'Edit',exact:true}).click();
await page.screenshot({path:'tmp/milestone-one/audit-before-edit.png'});
console.log('Editable assumption inputs:',await page.getByLabel(/Assumption [123]/).count());
await page.getByLabel('Email',{exact:true}).fill('lookout-walkthrough@example.com');
await page.getByRole('button',{name:'Save',exact:true}).click();
console.log('Save result:',await page.locator('.chat-error').innerText());
console.log('Thread:',await page.locator('.chat-thread').innerText());
console.log('Browser errors:',JSON.stringify(errors));
console.log('Horizontal overflow:',await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
await writeFile('tmp/milestone-one/audit-before-private-url.txt',page.url());
await writeFile('tmp/milestone-one/audit-before-responses.json',JSON.stringify(responses.map(({token,...safe})=>safe),null,2));
await browser.close();
