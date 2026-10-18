import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {splitHoldingReasons,holdingsQueries} from '../../shared/holdings-research.mjs';
const deployment=readFileSync('.env.local','utf8').match(/^CONVEX_DEPLOYMENT=(.*)$/m)?.[1].split('#')[0].trim();if(deployment!=='dev:fearless-ferret-257')throw Error('Dev deployment required');
mkdirSync('tmp/diagnosis',{recursive:true});
function cli(args){const r=spawnSync(process.execPath,['node_modules/convex/bin/main.js',...args],{encoding:'utf8',timeout:600000,maxBuffer:30*1024*1024});if(r.status!==0)throw Error('Dev CLI failed: '+args[0]);return r.stdout.trim()?JSON.parse(r.stdout):null;}
function run(name,args){return cli(['run',name,JSON.stringify(args)]);}
const {before,start,reasons,cacheBefore}=JSON.parse(readFileSync('tmp/diagnosis/before.json','utf8'));const session=JSON.parse(readFileSync('tmp/diagnosis/session-private.json','utf8'));
const view=run('holdings:read',{token:session.token}),after=run('aiSpend:today',{});
const threads=cli(['data','threads','--component','agent','--limit','20','--format','json']).filter(t=>t._creationTime>=start);
const messages=cli(['data','messages','--component','agent','--limit','100','--format','json']).filter(m=>threads.some(t=>t._id===m.threadId));
const cacheAfter=cli(['data','stockResearchCache','--limit','100','--format','json']);
writeFileSync('tmp/diagnosis/result.json',JSON.stringify({before,after,start,reasons,view,threads,messages,cacheBefore,cacheAfter},null,2));
console.log(JSON.stringify({reasons,progress:view.lines[0].progress,error:view.lines[0].error,statuses:view.lines[0].result?.assumptions.map(x=>({reason:x.assumption,status:x.status})),before,after,threadCount:threads.length,messageCount:messages.length}));
