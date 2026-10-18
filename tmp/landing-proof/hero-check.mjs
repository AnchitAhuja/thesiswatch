import {chromium} from '../../passport-tools/node_modules/playwright-core/index.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage();
try{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height] of [[1280,900],[390,844]]){
  await page.setViewportSize({width,height});await page.goto('https://fearless-ferret-257.convex.site/');
  await page.getByRole('button',{name:'Get started',exact:true}).waitFor();await page.locator('.family-photo').evaluate(img=>img.decode());await page.evaluate(()=>document.fonts.ready);
  const proof=await page.evaluate(()=>({headline:document.querySelector('h1').innerText.replace(/\s+/g,' ').trim(),subtitle:document.querySelector('.dark-intro').innerText,button:document.querySelector('.landing-capture button').innerText,signIn:[...document.querySelectorAll('a,button')].some(e=>e.innerText==='Sign in'),anchor:document.querySelector('.how-it-works').id,overflow:document.documentElement.scrollWidth>innerWidth}));
  if(proof.headline!=='Invest. Then move on with your life.'||proof.button!=='Get started'||proof.signIn||proof.overflow)throw Error(JSON.stringify(proof));
  await page.locator('.photo-hero').screenshot({path:`tmp/landing-proof/dev-hero-centered-${width}.png`});
  const layout=await page.evaluate(()=>{const form=document.querySelector('.landing-capture form'),button=form.querySelector('button');return {centres:['h1','.dark-intro','.landing-capture button'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return Math.abs(r.x+r.width/2-innerWidth/2);}),textAlign:getComputedStyle(document.querySelector('h1')).textAlign,border:getComputedStyle(form).borderWidth,background:getComputedStyle(form).backgroundColor,padding:getComputedStyle(button).padding,fontSize:getComputedStyle(button).fontSize};});
  console.log(JSON.stringify({width,layout}));if(layout.centres.some(x=>x>2)||layout.textAlign!=='center'||layout.border!=='0px')throw Error('Hero alignment failed');
  console.log(JSON.stringify({width,...proof}));
  await page.getByRole('link',{name:'How It Works',exact:true}).click();await page.waitForFunction(()=>location.hash==='#how-it-works'&&document.querySelector('#how-it-works').getBoundingClientRect().top>=-10&&document.querySelector('#how-it-works').getBoundingClientRect().top<innerHeight-100);
  await page.screenshot({path:`tmp/landing-proof/dev-how-it-works-${width}.png`});
 }
 await page.getByRole('button',{name:'Get started',exact:true}).click();await page.getByRole('heading',{name:'My holdings',exact:true}).waitFor();
 console.log(JSON.stringify({mainButtonTarget:page.url(),errors}));if(errors.length)throw Error('Browser errors');
}finally{await browser.close();}
