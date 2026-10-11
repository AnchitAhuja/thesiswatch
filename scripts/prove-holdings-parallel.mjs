import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {ConvexClient} from 'convex/browser';
import {api} from '../convex/_generated/api.js';
const env=readFileSync('.env.local','utf8');
if(env.match(/^CONVEX_DEPLOYMENT=(.*)$/m)?.[1].split('#')[0].trim()!=='dev:fearless-ferret-257')throw Error('Only the dev deployment is allowed.');
const url='https://fearless-ferret-257.convex.cloud';
const [label,inputPath]=process.argv.slice(2);
if(!['before','after','warm'].includes(label)||!inputPath)throw Error('Pass before, after or warm and a JSON file containing the exact ITC reasons.');
const itcReasons=JSON.parse(readFileSync(inputPath,'utf8'));
if(!Array.isArray(itcReasons)||!itcReasons.length||itcReasons.some(x=>typeof x!=='string'||!x.trim()))throw Error('Exact ITC reasons are required.');
const items=[{stock:'Delhivery',reasons:['one of the few tech delivery platforms','scale it is able to bring','network design is good']},{stock:'ITC',reasons:itcReasons}];
function run(name,args){const result=spawnSync(process.execPath,['node_modules/convex/bin/main.js','run',name,JSON.stringify(args)],{encoding:'utf8',timeout:600000});if(result.status!==0)throw Error('Dev function failed: '+name);return result.stdout.trim()?JSON.parse(result.stdout):null;}
const token=randomBytes(32).toString('hex');
run('holdings:create',{token,original:'Dev timing proof with exact supplied reasons',items:label==='warm'?[items[1]]:items});
run('holdings:confirm',{token,items:label==='warm'?[items[1]]:items});
mkdirSync('tmp/standing',{recursive:true});writeFileSync(`tmp/standing/parallel-${label}-private.json`,JSON.stringify({token}));
const before=run('aiSpend:today',{}),client=new ConvexClient(url,{unsavedChangesWarning:false});
let started=0,firstMs=null,allMs=null,latest=null;
const statuses=[],lastSteps=new Map();
const off=client.onUpdate(api.holdings.read,{token},view=>{
 latest=view;if(!started||!view)return;
 const elapsedMs=Math.round(performance.now()-started);
 for(const line of view.lines){if(line.progress?.step&&lastSteps.get(line.stock)!==line.progress.step){statuses.push({stock:line.stock,step:line.progress.step,elapsedMs});lastSteps.set(line.stock,line.progress.step);}}
 if(firstMs===null&&view.lines.some(line=>line.result))firstMs=elapsedMs;
 if(view.lines.every(line=>line.result)&&allMs===null)allMs=elapsedMs;
});
await client.query(api.holdings.read,{token});started=performance.now();
try{await client.action(api.holdingsActions.checkAll,{token});latest=await client.query(api.holdings.read,{token});}finally{off();await client.close();}
const elapsedMs=Math.round(performance.now()-started),after=run('aiSpend:today',{});
const proof={label,deployment:'dev:fearless-ferret-257',timingKind:'Convex live result events; browser timing must be measured separately',firstResultMs:firstMs,allResultsMs:allMs,totalActionMs:elapsedMs,statuses,spendInr:after.estimatedInr-before.estimatedInr,calls:after.calls-before.calls,results:latest?.lines};
writeFileSync(`tmp/standing/parallel-${label}-result.json`,JSON.stringify(proof,null,2));console.log(JSON.stringify(proof,null,2));
if(latest?.lines.some(line=>!line.result||line.error))process.exitCode=1;
