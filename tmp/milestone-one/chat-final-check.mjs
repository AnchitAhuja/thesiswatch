import {chromium} from '../../passport-tools/node_modules/playwright-core/index.mjs';
import {readFile} from 'node:fs/promises';
const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const p=await b.newPage();
await p.goto((await readFile('tmp/milestone-one/chat-private-url.txt','utf8')).trim());await p.getByText('Saved privately.',{exact:true}).waitFor();await p.getByRole('button',{name:'Edit',exact:true}).click();await p.getByRole('button',{name:'Cancel',exact:true}).click();
await p.setViewportSize({width:390,height:1250});await p.getByRole('button',{name:'Edit',exact:true}).click();await p.getByRole('button',{name:'Cancel',exact:true}).click();await p.locator('.thread-thesis').evaluate(el=>el.scrollIntoView({block:'start'}));await p.screenshot({path:'tmp/milestone-one/chat-390-saved.png'});
await b.close();
