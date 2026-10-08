import {chromium} from '../../passport-tools/node_modules/playwright-core/index.mjs';
import {createInterface} from 'node:readline';
const context=await chromium.launchPersistentContext('C:/Users/Lenovo/build-sprint-app/tmp/chrome-dashboard-review-profile',{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:false,viewport:{width:1280,height:900}});
const page=context.pages()[0]||await context.newPage();
await page.goto('https://dashboard.convex.dev/t/anchitgh71/build-sprint-app/fearless-ferret-257/data?table=customTheses');
console.log(await page.locator('body').innerText());
const rl=createInterface({input:process.stdin});for await(const line of rl){try{const fn=new Function('page','context',`return (async()=>{${line}})()`);console.log(await fn(page,context));}catch(e){console.log(e.message)}}
