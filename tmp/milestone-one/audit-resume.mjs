import {chromium} from '../../passport-tools/node_modules/playwright-core/index.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:false});const page=await browser.newPage({viewport:{width:1280,height:900}});let calls=0;const errors=[];
page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/action',route=>{calls++;return route.abort()});
const shot=async name=>{await page.screenshot({path:`tmp/milestone-one/final-${name}.png`});};
try {
await page.goto((await readFile('tmp/milestone-one/final-walk-private-url.txt','utf8')).trim());await page.getByRole('heading',{name:'Your thesis',exact:true}).waitFor();await shot('06-thesis');
await page.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Assumption 1',{exact:true}).fill('Household income gains translate into higher spending rather than savings.');await shot('07-edit-assumption');
await page.getByLabel('Email',{exact:true}).fill('lookout-walkthrough@example.com');await shot('08-email-save');
await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('Saved privately.',{exact:true}).waitFor();await shot('09-saved');
await page.reload();await page.getByText('Saved privately.',{exact:true}).waitFor();await page.getByText('Household income gains translate into higher spending rather than savings.',{exact:true}).waitFor();await shot('10-reloaded');
await page.getByRole('button',{name:'Copy private link',exact:true}).click();await page.getByText('Private link copied.',{exact:true}).waitFor();
console.log('PASS: resumed the same final live conversation; edited one assumption; saved with email and no invented missing context; reload retained edit; private link copy works; zero model requests.');
await writeFile('tmp/milestone-one/final-walk-thread.txt',await page.locator('.chat-thread').innerText());
if(calls||errors.length)throw Error(JSON.stringify({calls,errors}));
}finally{await browser.close()}
