import {chromium} from '../../passport-tools/node_modules/playwright-core/index.mjs';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{const page=await browser.newPage();for(const [width,height]of[[1280,900],[390,844]])for(const [name,route,header]of[['landing','/','.dark-header'],['holdings','/?create=holdings','.holdings-page header']]){
 await page.setViewportSize({width,height});await page.goto('https://fearless-ferret-257.convex.site'+route);const logo=page.getByRole('img',{name:'Lookout',exact:true});await logo.waitFor();await logo.evaluate(img=>img.decode());await page.evaluate(()=>document.fonts.ready);
 if(name==='holdings'){await page.getByLabel('Which stocks should we watch?',{exact:true}).fill('Delhivery');if(await page.locator('#stock-match').innerText()!=='')throw Error('Match detail line remains');}
 const result=await logo.evaluate(img=>({src:img.getAttribute('src'),alt:img.alt,height:img.getBoundingClientRect().height,home:img.closest('a').getAttribute('href'),loaded:img.naturalWidth>0}));if(result.height!==32||result.home!=='/'||!result.loaded)throw Error(JSON.stringify(result));
 await page.locator(header).screenshot({path:`tmp/landing-proof/dev-${name}-transparent-logo-bar-${width}.png`});console.log(JSON.stringify({width,page:name,...result}));
 }}finally{await browser.close();}
