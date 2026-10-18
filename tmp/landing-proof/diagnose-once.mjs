import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {splitHoldingReasons,holdingsQueries} from '../../shared/holdings-research.mjs';
const deployment=readFileSync('.env.local','utf8').match(/^CONVEX_DEPLOYMENT=(.*)$/m)?.[1].split('#')[0].trim();if(deployment!=='dev:fearless-ferret-257')throw Error('Dev deployment required');
mkdirSync('tmp/diagnosis',{recursive:true});
function cli(args){const r=spawnSync(process.execPath,['node_modules/convex/bin/main.js',...args],{encoding:'utf8',timeout:600000,maxBuffer:30*1024*1024});if(r.status!==0)throw Error('Dev CLI failed: '+args[0]);return JSON.parse(r.stdout);}
function run(name,args){return cli(['run',name,JSON.stringify(args)]);}
const text='tech first company optimising logistics cost, partnerships already with multiple ecommerce players';const reasons=splitHoldingReasons(text);
const before=run('aiSpend:today',{}),start=Date.now();const cacheBefore=cli(['data','stockResearchCache','--limit','100','--format','json']);
writeFileSync('tmp/diagnosis/before.json',JSON.stringify({before,start,reasons,queries:holdingsQueries('Delhivery Ltd.',reasons),cacheBefore},null,2));
const session=run('holdingsActions:startHolding',{stock:'Delhivery',text});writeFileSync('tmp/diagnosis/session-private.json',JSON.stringify(session));
run('holdingsActions:checkAll',{token:session.token});
const view=run('holdings:read',{token:session.token}),after=run('aiSpend:today',{});
const threads=cli(['data','threads','--component','agent','--limit','20','--format','json']).filter(t=>t._creationTime>=start);
const messages=cli(['data','messages','--component','agent','--limit','100','--format','json']).filter(m=>threads.some(t=>t._id===m.threadId));
const cacheAfter=cli(['data','stockResearchCache','--limit','100','--format','json']);
writeFileSync('tmp/diagnosis/result.json',JSON.stringify({before,after,start,reasons,view,threads,messages,cacheBefore,cacheAfter},null,2));
console.log(JSON.stringify({reasons,progress:view.lines[0].progress,error:view.lines[0].error,statuses:view.lines[0].result?.assumptions.map(x=>({reason:x.assumption,status:x.status})),before,after,threadCount:threads.length,messageCount:messages.length}));
